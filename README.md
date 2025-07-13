# SproutSense

**SproutSense** is a network of smart environmental sensors designed to help farmers monitor real-time field conditions and optimize agricultural practices. This repository contains the source code for the web dashboard and backend server.

To view the custom PCB hardware repository, visit: [capstone_PCB](https://github.com/jchanDev/capstone_PCB)

Check out our paper: [Real-Time Environment Monitoring for Sustainable Agricultural Practices](https://github.com/bk1031/sprout_sense/itc25.pdf), which was accepted to the 2025 International Telemetering Conference, and will be published in their [2025 (Vol. 60) journal](https://repository.arizona.edu/handle/10150/575867).

## Getting Started

First, start the required services defined in the provided Docker Compose file.

```
docker compose up
```

## Architecture

The project consists of a series of services spanning the hardware/software stack.

| Service          | Description                                                                             | Tooling           |
| ---------------- | --------------------------------------------------------------------------------------- | ----------------- |
| **Base Station** | Firmware code for the base stations.                                                    | C++               |
| **Firmware**     | Firmware code for the sensor modules.                                                   | C                 |
| **Ingest**       | A data ingestion service that collects and processes sensor data from the field modules | Python, Poetry    |
| **Web**          | A web application that provides the user interface                                      | TypeScript, React |
