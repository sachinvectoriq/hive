"""Seed script — populates the database with sample data."""
import asyncio
from sqlalchemy import func
from app.database import async_session, engine, Base
from app.models import *  # noqa
from app.models.user import User
from app.models.application import Application, GitRepo, Resource, RoleAssignment, Person, Task
from app.auth.utils import hash_password


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # --- Admin user ---
        admin = User(
            username="admin",
            email="admin@hive.io",
            hashed_password=hash_password("admin123"),
            role="admin",
        )
        db.add(admin)
        await db.flush()

        # --- Application 1: AI Chat Platform ---
        app1 = Application(name="AI Chat Platform", description="Customer-facing AI chatbot powered by Azure OpenAI")
        db.add(app1)
        await db.flush()

        db.add_all([
            GitRepo(application_id=app1.id, repo_name="ai-chat-api", owner="Platform Team", link="https://dev.azure.com/org/ai-chat-api"),
            GitRepo(application_id=app1.id, repo_name="ai-chat-frontend", owner="Frontend Team", link="https://dev.azure.com/org/ai-chat-frontend"),
        ])
        db.add_all([
            Resource(application_id=app1.id, resource_group="rg-ai-prod", resource_name="oai-chat-prod", type="Microsoft.CognitiveServices/accounts", tier_sku="S0"),
            Resource(application_id=app1.id, resource_group="rg-ai-prod", resource_name="app-chat-prod", type="Microsoft.Web/sites", tier_sku="P1v3"),
            Resource(application_id=app1.id, resource_group="rg-ai-prod", resource_name="kv-ai-prod", type="Microsoft.KeyVault/vaults", tier_sku="Standard"),
            Resource(application_id=app1.id, resource_group="rg-ai-prod", resource_name="cosmos-chat-prod", type="Microsoft.DocumentDB/databaseAccounts", tier_sku="Standard"),
        ])
        db.add_all([
            RoleAssignment(application_id=app1.id, resource_group="rg-ai-prod", role_name="Cognitive Services Contributor", resource_name="oai-chat-prod"),
            RoleAssignment(application_id=app1.id, resource_group="rg-ai-prod", role_name="Key Vault Secrets User", resource_name="kv-ai-prod"),
            RoleAssignment(application_id=app1.id, resource_group="rg-ai-prod", role_name="Cosmos DB Account Reader", resource_name="cosmos-chat-prod"),
        ])
        db.add_all([
            Person(application_id=app1.id, name="Sarah Chen", applications_involved="AI Chat Platform, Data Pipeline", resource_groups_involved="rg-ai-prod", permissions="Contributor on oai-chat-prod, Reader on kv-ai-prod"),
            Person(application_id=app1.id, name="James Wilson", applications_involved="AI Chat Platform", resource_groups_involved="rg-ai-prod", permissions="Owner on rg-ai-prod"),
        ])
        db.add_all([
            Task(application_id=app1.id, title="Upgrade OpenAI model to GPT-4o", description="Migrate from GPT-4 to GPT-4o for faster responses", status="in-progress", severity="high", assigned_to="Sarah Chen", assigned_on=func.now()),
            Task(application_id=app1.id, title="Set up staging environment", description="Create rg-ai-staging with same resources", status="not-started", severity="medium", assigned_to="James Wilson", assigned_on=func.now()),
        ])

        # --- Application 2: Data Pipeline ---
        app2 = Application(name="Data Pipeline", description="ETL pipeline for data warehouse ingestion and transformation")
        db.add(app2)
        await db.flush()

        db.add_all([
            GitRepo(application_id=app2.id, repo_name="data-pipeline-core", owner="Data Engineering", link="https://dev.azure.com/org/data-pipeline-core"),
            GitRepo(application_id=app2.id, repo_name="data-pipeline-configs", owner="Data Engineering", link="https://dev.azure.com/org/data-pipeline-configs"),
        ])
        db.add_all([
            Resource(application_id=app2.id, resource_group="rg-data-prod", resource_name="adf-etl-prod", type="Microsoft.DataFactory/factories", tier_sku="Standard"),
            Resource(application_id=app2.id, resource_group="rg-data-prod", resource_name="sql-warehouse-prod", type="Microsoft.Sql/servers", tier_sku="S2"),
            Resource(application_id=app2.id, resource_group="rg-data-prod", resource_name="st-datalake-prod", type="Microsoft.Storage/storageAccounts", tier_sku="Standard_LRS"),
        ])
        db.add_all([
            RoleAssignment(application_id=app2.id, resource_group="rg-data-prod", role_name="Data Factory Contributor", resource_name="adf-etl-prod"),
            RoleAssignment(application_id=app2.id, resource_group="rg-data-prod", role_name="Storage Blob Data Contributor", resource_name="st-datalake-prod"),
        ])
        db.add_all([
            Person(application_id=app2.id, name="Marcus Johnson", applications_involved="Data Pipeline, Document Intelligence", resource_groups_involved="rg-data-prod, rg-docintel-prod", permissions="Contributor on adf-etl-prod, Reader on st-datalake-prod"),
            Person(application_id=app2.id, name="Emily Davis", applications_involved="Data Pipeline", resource_groups_involved="rg-data-prod", permissions="SQL Server Contributor on sql-warehouse-prod"),
        ])
        db.add_all([
            Task(application_id=app2.id, title="Fix data ingestion timeout", description="Pipeline fails on large CSV files >2GB", status="in-progress", severity="critical", assigned_to="Marcus Johnson", assigned_on=func.now()),
            Task(application_id=app2.id, title="Add monitoring alerts", description="Set up alerts for pipeline failures", status="not-started", severity="medium", assigned_to="Emily Davis", assigned_on=func.now()),
        ])

        # --- Application 3: Document Intelligence ---
        app3 = Application(name="Document Intelligence", description="AI-powered document processing and classification service")
        db.add(app3)
        await db.flush()

        db.add_all([
            GitRepo(application_id=app3.id, repo_name="docintel-service", owner="AI Team", link="https://dev.azure.com/org/docintel-service"),
        ])
        db.add_all([
            Resource(application_id=app3.id, resource_group="rg-docintel-prod", resource_name="form-recognizer-prod", type="Microsoft.CognitiveServices/accounts", tier_sku="S0"),
            Resource(application_id=app3.id, resource_group="rg-docintel-prod", resource_name="func-docintel-prod", type="Microsoft.Web/sites", tier_sku="Y1"),
            Resource(application_id=app3.id, resource_group="rg-docintel-prod", resource_name="st-docintel-prod", type="Microsoft.Storage/storageAccounts", tier_sku="Standard_LRS"),
        ])
        db.add_all([
            RoleAssignment(application_id=app3.id, resource_group="rg-docintel-prod", role_name="Cognitive Services User", resource_name="form-recognizer-prod"),
            RoleAssignment(application_id=app3.id, resource_group="rg-docintel-prod", role_name="Storage Blob Data Reader", resource_name="st-docintel-prod"),
        ])
        db.add_all([
            Person(application_id=app3.id, name="Alex Kim", applications_involved="Document Intelligence", resource_groups_involved="rg-docintel-prod", permissions="Contributor on form-recognizer-prod"),
        ])
        db.add_all([
            Task(application_id=app3.id, title="Integrate new document classifier", description="Add support for invoice classification", status="completed", severity="high", assigned_to="Alex Kim", assigned_on=func.now()),
        ])

        await db.commit()
        print("Seeded: 1 admin, 3 applications with repos, resources, roles & people")


if __name__ == "__main__":
    asyncio.run(seed())
