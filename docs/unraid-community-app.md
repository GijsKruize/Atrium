# Publishing Atrium to Unraid Community Applications

## Prerequisites

1. **Pre-built Docker images** on a public registry (GHCR or Docker Hub)
2. **XML templates** for each container
3. **App icon** (256x256 PNG)

---

## Step 1: Publish Docker Images

Set up GitHub Actions to build and push on each release tag.

Images needed:
- `ghcr.io/vibra-labs/atrium-api:latest`
- `ghcr.io/vibra-labs/atrium-web:latest`

Example workflow (`.github/workflows/docker-publish.yml`):

```yaml
name: Publish Docker Images
on:
  release:
    types: [published]

env:
  REGISTRY: ghcr.io

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        include:
          - image: atrium-api
            dockerfile: docker/api.Dockerfile
          - image: atrium-web
            dockerfile: docker/web.Dockerfile
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          file: ${{ matrix.dockerfile }}
          push: true
          tags: |
            ${{ env.REGISTRY }}/vibra-labs/${{ matrix.image }}:latest
            ${{ env.REGISTRY }}/vibra-labs/${{ matrix.image }}:${{ github.event.release.tag_name }}
```

---

## Step 2: Create XML Templates

Create these in an `unraid/` folder in the repo.

### `unraid/atrium-api.xml`

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>Atrium-API</Name>
  <Repository>ghcr.io/vibra-labs/atrium-api:latest</Repository>
  <Registry>https://github.com/Vibra-Labs/Atrium/pkgs/container/atrium-api</Registry>
  <Branch>
    <Tag>latest</Tag>
    <TagDescription>Latest stable release</TagDescription>
  </Branch>
  <Network>bridge</Network>
  <Shell>sh</Shell>
  <Privileged>false</Privileged>
  <Support>https://github.com/Vibra-Labs/Atrium/issues</Support>
  <Project>https://github.com/Vibra-Labs/Atrium</Project>
  <Overview>Atrium API — self-hosted client portal for agencies and freelancers. Requires Atrium-Web and PostgreSQL containers.</Overview>
  <Category>Productivity: Tools:</Category>
  <Icon>https://raw.githubusercontent.com/Vibra-Labs/Atrium/main/unraid/icon.png</Icon>
  <TemplateURL>https://raw.githubusercontent.com/Vibra-Labs/Atrium/main/unraid/atrium-api.xml</TemplateURL>
  <Config Name="API Port" Target="3001" Default="3001" Mode="tcp" Type="Port" Display="always" Required="true" Description="Port the API listens on"/>
  <Config Name="DATABASE_URL" Target="DATABASE_URL" Default="postgresql://atrium:atrium@Atrium-DB:5432/atrium?schema=public" Type="Variable" Display="always" Required="true" Description="PostgreSQL connection string"/>
  <Config Name="BETTER_AUTH_SECRET" Target="BETTER_AUTH_SECRET" Default="" Type="Variable" Display="always" Required="true" Description="Random secret for auth tokens (min 32 chars)"/>
  <Config Name="BETTER_AUTH_URL" Target="BETTER_AUTH_URL" Default="http://localhost:3001" Type="Variable" Display="always" Required="true" Description="Public URL where browsers reach the API"/>
  <Config Name="WEB_URL" Target="WEB_URL" Default="http://localhost:3000" Type="Variable" Display="always" Required="true" Description="Public URL of the web frontend"/>
  <Config Name="STORAGE_PROVIDER" Target="STORAGE_PROVIDER" Default="local" Type="Variable" Display="always" Description="Storage backend: local, s3, minio, or r2"/>
  <Config Name="Uploads" Target="/app/uploads" Default="/mnt/user/appdata/atrium/uploads" Mode="rw" Type="Path" Display="always" Description="File upload storage path"/>
</Container>
```

### `unraid/atrium-web.xml`

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>Atrium-Web</Name>
  <Repository>ghcr.io/vibra-labs/atrium-web:latest</Repository>
  <Registry>https://github.com/Vibra-Labs/Atrium/pkgs/container/atrium-web</Registry>
  <Branch>
    <Tag>latest</Tag>
    <TagDescription>Latest stable release</TagDescription>
  </Branch>
  <Network>bridge</Network>
  <Shell>sh</Shell>
  <Privileged>false</Privileged>
  <Support>https://github.com/Vibra-Labs/Atrium/issues</Support>
  <Project>https://github.com/Vibra-Labs/Atrium</Project>
  <Overview>Atrium Web — frontend for the Atrium client portal. Requires Atrium-API container.</Overview>
  <Category>Productivity: Tools:</Category>
  <Icon>https://raw.githubusercontent.com/Vibra-Labs/Atrium/main/unraid/icon.png</Icon>
  <TemplateURL>https://raw.githubusercontent.com/Vibra-Labs/Atrium/main/unraid/atrium-web.xml</TemplateURL>
  <Config Name="Web Port" Target="3000" Default="3000" Mode="tcp" Type="Port" Display="always" Required="true" Description="Port the web UI listens on"/>
  <Config Name="API_URL" Target="API_URL" Default="http://Atrium-API:3001" Type="Variable" Display="always" Required="true" Description="Internal URL to reach the API container"/>
  <Config Name="NEXT_PUBLIC_API_URL" Target="NEXT_PUBLIC_API_URL" Default="http://localhost:3001" Type="Variable" Display="always" Required="true" Description="Public URL where browsers reach the API"/>
</Container>
```

### `unraid/atrium-db.xml`

```xml
<?xml version="1.0"?>
<Container version="2">
  <Name>Atrium-DB</Name>
  <Repository>postgres:16-alpine</Repository>
  <Registry>https://hub.docker.com/_/postgres</Registry>
  <Branch>
    <Tag>16-alpine</Tag>
    <TagDescription>PostgreSQL 16 Alpine</TagDescription>
  </Branch>
  <Network>bridge</Network>
  <Shell>bash</Shell>
  <Privileged>false</Privileged>
  <Support>https://github.com/Vibra-Labs/Atrium/issues</Support>
  <Project>https://github.com/Vibra-Labs/Atrium</Project>
  <Overview>PostgreSQL database for Atrium client portal.</Overview>
  <Category>Productivity: Tools:</Category>
  <Icon>https://raw.githubusercontent.com/Vibra-Labs/Atrium/main/unraid/icon.png</Icon>
  <TemplateURL>https://raw.githubusercontent.com/Vibra-Labs/Atrium/main/unraid/atrium-db.xml</TemplateURL>
  <Config Name="DB Port" Target="5432" Default="5432" Mode="tcp" Type="Port" Display="always" Description="PostgreSQL port"/>
  <Config Name="POSTGRES_USER" Target="POSTGRES_USER" Default="atrium" Type="Variable" Display="always" Description="Database username"/>
  <Config Name="POSTGRES_PASSWORD" Target="POSTGRES_PASSWORD" Default="" Type="Variable" Display="always" Required="true" Description="Database password"/>
  <Config Name="POSTGRES_DB" Target="POSTGRES_DB" Default="atrium" Type="Variable" Display="always" Description="Database name"/>
  <Config Name="Data" Target="/var/lib/postgresql/data" Default="/mnt/user/appdata/atrium/pgdata" Mode="rw" Type="Path" Display="always" Description="Database storage path"/>
</Container>
```

---

## Step 3: Add an Icon

Place a 256x256 PNG at `unraid/icon.png` in the repo. Should be the Atrium logo on a transparent or solid background.

---

## Step 4: Submit to Community Applications

1. Fork https://github.com/selfhosters/unRAID-CA-templates
2. Add the three XML files to `templates/`
3. Open a pull request with a description of the app
4. CA maintainers review and merge

After merging, Atrium appears in the Unraid CA app store.

### Alternative: Self-hosted template repo

Users can add your repo as a template URL in Unraid manually:
- Docker tab → Template Repositories → add `https://github.com/Vibra-Labs/Atrium`
- Requires the XML files to be in the root or a recognized path

---

## Optional: Single Combined Image

Unraid users prefer fewer containers. Consider creating an all-in-one image that bundles API + Web + built-in SQLite/Postgres. This simplifies the install to a single container but adds complexity to the build.
