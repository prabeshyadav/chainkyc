# Reusable KYC

This repository contains a full-stack KYC workflow with a Django backend, a React/Vite frontend, and Solidity smart contracts managed with Foundry.

## 1. Prerequisites

Install the following before you begin:

- Docker Desktop (recommended for local stack startup)
- Python 3.11+
- Node.js 22+
- Foundry

## 2. Environment setup

Create your local environment file from the sample:

```bash
cp .env.example .env
```

Update the values in `.env` before starting the stack.

### Required backend variables

- `DJANGO_SECRET_KEY`: a secure secret key
- `DJANGO_DEBUG`: set to `True` for development
- `BLOCKCHAIN_RPC_URL`: RPC URL for your Ethereum network
- `ROLE_MANAGER_ADDRESS`: deployed RoleManager contract address
- `KYC_REGISTRY_ADDRESS`: deployed KYCRegistry contract address
- `CHAIN_ID`: chain ID for the network (for local Anvil, use `31337`)

## 3. Deploy the smart contracts

### Option A: local development with Anvil

Start a local Ethereum node:

```bash
cd contracts
anvil --port 8545
```

In a second terminal, deploy the contracts:

```bash
cd contracts
PRIVATE_KEY=your_deployer_private_key forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

The deployment script will print the addresses of the deployed contracts. Copy those values into your `.env` file:

```env
ROLE_MANAGER_ADDRESS=0x...
KYC_REGISTRY_ADDRESS=0x...
```

### Option B: deploy to a public testnet

Use a provider such as Alchemy or Infura:

```bash
cd contracts
PRIVATE_KEY=your_deployer_private_key forge script script/Deploy.s.sol --rpc-url https://your-rpc-url --broadcast
```

Then update `.env` with the returned contract addresses and the corresponding `CHAIN_ID`.

## 4. Connect the backend to the deployed contracts

The Django backend reads blockchain settings from the environment variables in `.env`:

- `BLOCKCHAIN_RPC_URL`
- `ROLE_MANAGER_ADDRESS`
- `KYC_REGISTRY_ADDRESS`
- `CHAIN_ID`

When those values are present, the backend will connect to the contract layer automatically through the blockchain services.

## 5. Start the full stack

### With Docker Compose

```bash
docker compose up --build
```

This starts:

- PostgreSQL
- Anvil
- Django backend on port `8001`
- Vite frontend on port `5173`

### Without Docker

Start the backend:

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8001
```

Start the frontend:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## 6. Frontend connection

The frontend expects the backend API base URL. Set it in the frontend environment if needed:

```env
VITE_API_BASE_URL=http://localhost:8001/api
```

If you are running everything through Docker Compose, the default value in the compose file already points to the backend container.

## 7. Notes

- For local Docker-based development, `BLOCKCHAIN_RPC_URL` should usually be `http://anvil:8545` inside the backend container.
- For local non-Docker development, use `http://localhost:8545`.
- Keep your private keys and production addresses out of source control.
