# Ansible Performance Test Orchestrator (k6 + InfluxDB + Grafana + Ansible)

A lightweight framework to **orchestrate distributed load testing** across multiple Linux Ubuntu servers using:

- Ansible
- k6
- InfluxDB
- Grafana

You define your load test scripts (projects with preset URL list, REST APIs, etc.), and Ansible automatically:

- Deploys and prepares load generators
- Runs data population scripts (Node.js)
- Executes k6 load tests
- Streams results to InfluxDB
- Visualizes metrics in Grafana
- Extract k6 logs to Control Node server

This project helps teams run **repeatable, distributed performance tests** easily.

---

## Use Cases
This framework can be used for:
- Testing for preset URLs
- API stress testing
- Event traffic simulation
- Capacity planning (e.g. populate cache for sites)
- CI/CD performance validation

## Architecture
```bash
Control Node (Ansible + Docker)
│
SSH
│
┌──────────┐ ┌──────────┐
│ LoadGen1 │ │ LoadGen2 │
│ (k6+Node)│ │ (k6+Node)│
└──────────┘ └──────────┘
│                     │
└──── Writes Metrics ─┘
         ↓
InfluxDB + Grafana
```

## Prerequisites

**Control Node**
- Runs Ansible
  - To install, run `pip install ansible`
  - Validate installation via `ansible --version`

- Hosts InfluxDB and Grafana via Docker
  - To install, run `docker-compose -f docker-compose-monitoring.yml up -d`

**Load Generator Servers**
- Operates on Ubuntu / Linux
- SSH access from the control node (set the server IP in inventory.ini to allow Ansible to automate SSH connection from Control Node)
- Internet access (npm + k6 downloads)

## Commands

### Test connectivity
```bash
ansible all -i inventory.ini -m ping --private-key ~/.ssh/my-aws-key.pem
```
If successful, the control node can manage the load generators

### Setup
```bash
ansible-playbook -i inventory.ini ./playbooks/setup.yml \
  --private-key ~/.ssh/my-aws-key.pem
```
This prepares the servers with:
- copying ./loadgen folder to load generators
- k6
- Node.js
- required utilities

### (Optional) Populate preset URLS
Optional for tests that require generating request data first (for example, extracting URLs from a sitemap).
```bash
ansible-playbook -i inventory.ini ./playbooks/populate.yml \
  --private-key ~/.ssh/my-aws-key.pem \
  -e 'site=site-a' \
  -e 'sitemapUrls=["https://site-a.com.my/sitemap/pages.xml"]' \
  -e 'preset_urls_data_file=get-sitemap-urls.js'
```

Enable the optional 404 sitemap population by adding `-e 'generate_404=true'`.

### Run load test
Runs a project across all load generators.
```bash
ansible-playbook -i inventory.ini ./playbooks/run-<project>.yml \
  --private-key ~/.ssh/my-aws-key.pem \
  -e 'preset_urls_project_map=["site-a"]' \
  -e 'influxdb_url=http://localhost:8086/k6'
```
Replace <project> with:
- run-rest-api-project.yml
- run-preset-urls-project.yml

Example:
```bash
ansible-playbook -i inventory.ini ./playbooks/run-rest-api-project.yml \
  --private-key ~/.ssh/my-aws-key.pem \
  -e 'rest_api_projects_map=["site-a"]' \
  -e 'influxdb_url=http://localhost:8086/k6'
```

To target specific load generators with different project/site respectively, pass:
- `rest_api_projects_map`, or
- `preset_urls_projects_map`

Example:
```bash
ansible-playbook -i inventory.ini ./playbooks/run-rest-api-project.yml \
  --private-key ~/.ssh/my-aws-key.pem \
  -e 'rest_api_projects_map={"lg1":["endpoint_1","endpoint_2"],"lg2":["endpoint_3"]}' \
  -e 'influxdb_url=http://localhost:8086/k6'
```
Example behaviour:
```bash
lg1 → endpoint_1 + endpoint_2
lg2 → endpoint_3
```
This helps ditribute traffic across the load generators, especially useful to manage high traffic to be tested across the projects/sites

### Stop k6
Stop all running load tests.
```bash
ansible-playbook -i inventory.ini ./playbooks/stop-k6.yml \
  --private-key ~/.ssh/my-aws-key.pem
```

### Fetch logs
Download logs and summaries from load generators.
```bash
ansible-playbook -i inventory.ini ./playbooks/fetch-logs.yml --private-key ~/.ssh/my-aws-key.pem
```

To choose which project folder to read from under `projects/`, pass `project_name` with just the folder name:
```bash
ansible-playbook -i inventory.ini ./playbooks/fetch-logs.yml \
  --private-key ~/.ssh/my-aws-key.pem \
  -e 'project_name=preset-urls-project'
```

Results will be stored in `results/<loadgen-host>/`. This includes:
- k6 output
- logs
- summaries


## Contributing
Contributions are welcome.
You can help by:
- Adding new test scenarios
- Optimizing playbooks
- Reporting issues

If you find a bug or have an improvement idea, open an issue or submit a PR.
