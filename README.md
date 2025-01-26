# Deacero

API REST construida con `TypeScript` y `NestJS`.

## Prerequisitos

- AWS CLI v2
- Una cuenta de AWS
- Node.js v22.12.0 (versión usada en este proyecto)
- Credenciales de AWS configuradas con `aws configure` o exportadas en terminal

## Configuración

Clona el repositorio e instala las dependencias:

```bash
npm install
```

## Desarrollo local

Para correr el proyecto localmente:

- Levanta una base de datos PostgreSQL con Docker:
  ```bash
  docker compose up -d
  ```
- Inicia el servidor en modo desarrollo:
  ```bash
  npm run start:dev
  ```

El servidor estará disponible en `http://localhost:50001`.

## Despliegue en AWS

Script automatizado para desplegar una aplicacion NestJS en AWS. Automatiza la configuración de servicios cloud, incluyendo:

- Creación de repositorio en ECR
- Configuracion de base de datos RDS (Postgresql)
- Build de nestjs en docker
- Configuracion de cluster ECS Fargate
- Implementación de un load balancer (ALB)
- IAM
- Configuracion de variables de entorno seguras

El script maneja la infraestructura de manera idempotente, permitiendo actualizaciones repetibles con un solo comando, como si fuera nuesto CICD

Asegura que el script tenga permisos de ejecución:

```bash
chmod +x deploy.sh
```

Para desplegar la aplicación, usa el script `deploy.sh` con el flag `--name`:

```bash
./deploy.sh --name=deacero
```

## Seed a base de datos

Para hacer seed a nuestra base de datos _local_, es necesario correr el script

```bash
npm run seed
```

Para hacer seed a nuestra base de datos _remota_, es necesario pasar como una variable de entorno la conexión de RDS. Puedes ingresar a SSM Parameter Store para ver el valor.

O puedes usar `aws cli`

```bash
aws ssm get-parameter --name "/$NAME/DATABASE_URL" --region us-west-1 --with-decryption --query "Parameter.Value" --output text
```

```bash
DATABASE_URL=DATABASE_URL npm run seed
```
