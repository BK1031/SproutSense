# SproutSense

SproutSense is a network of smart sensors designed to provide farmers with real-time environmental data to optimize agricultural practices.

## Getting Started

First, start the required services defined in the provided Docker Compose file.

```
docker compose up
```

## Architecture

The project consists of a series of services spanning the hardware/software stack.

| Service | Description | Tooling |
|---------|-------------|------------|
| **Base Station** | Firmware code for the base stations. | C++ |
| **Firmware** | Firmware code for the sensor modules. | C |
| **Ingest** | A data ingestion service that collects and processes sensor data from the field modules | Python, Poetry |
| **Web** | A web application that provides the user interface | TypeScript, React |
