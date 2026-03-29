# Ofwat PR24 Final Determination — SVT Dashboard

Interactive dashboard for exploring Ofwat's PR24 Final Determination data (December 2024), focused on Severn Trent Water (SVT). Built as a fully static React app — all data is served from JSON files with no backend. Designed for deployment to Cloudflare Pages.

## Prerequisites

- **Node.js 20+** (for building the dashboard)
- **Python 3.11+** (only if you need to re-run data ingestion)

## Local development

```bash
cd dashboard

# Ensure data/ is available in public/ (symlink or copy)
ln -s ../../data public/data        # if data/ is one level up
# cp -r ../data public/data         # alternative: hard copy

npm install
npm run dev
```

Opens at http://localhost:5173. The app fetches only small JSON files on startup and lazy-loads benchmarking/trend data on demand.

## Project structure

```
dashboard/
  src/
    components/     Shared UI: NavBar, MetricCard, MetricSelector, etc.
    views/          SVTAtAGlance, Benchmarking, Trends, MetricExplorer
    context/        DataContext — manages all fetched data and caching
    hooks/          useMetricData, useBenchmarkData, useTrendData
    utils/          formatters.js (£m, %, ratios, etc.)
  public/
    data/           Static JSON (symlink, not committed to git)
    _headers        Cloudflare Pages cache/security headers
  scripts/
    build-full.sh   Vite build + copy data into dist/
    bundle-data.sh  Copy public/data/ into dist/data/
```

## Data files

All data lives in `public/data/` (~110 MB, excluded from git):

| File | Size | Description |
|------|------|-------------|
| `companies.json` | 6 KB | 26 companies with resolved codes and types |
| `metrics.json` | ~600 KB | 4,023 canonical metrics with taxonomy |
| `priority_metrics.json` | 17 KB | 37 SVT priority metrics |
| `svt_summary.json` | ~3 MB | SVT/SVE values for all canonical metrics |
| `benchmarking/{id}.json` | ~100 MB total | One file per metric, all companies |
| `trends/{code}.json` | ~7 MB total | One file per company, all metrics |

## Re-running data ingestion

If you need to refresh from the source Excel files:

```bash
# From the project root (parent of dashboard/)
python3 ingest.py              # Parse Excel → ofwat_fd.db
python3 metric_analysis.py     # Generate dedup/taxonomy/priority proposals
python3 rebuild_exports.py     # Export cleaned data → data/
```

The raw Excel files (~260 files) and SQLite database (`ofwat_fd.db`, ~70 MB) are not in the repo. Contact the repo owner for access.

## Building for production

```bash
# Standard Vite build (no data, for CI use)
npm run build

# Full build with data bundled into dist/ (for manual deploy)
npm run build:full
```

## Deployment

### Option A — Manual deploy (recommended for first deploy)

1. Build with data included:
   ```bash
   cd dashboard
   npm run build:full
   ```
2. This produces `dist/` (~115 MB) with all data files.
3. Go to the Cloudflare Pages dashboard → Create project → Upload assets.
4. Drag and drop the entire `dist/` folder.

### Option B — Automated CI/CD via GitHub Actions + Cloudflare R2

For ongoing deploys, store the data in Cloudflare R2 and let GitHub Actions pull it at build time. This keeps the git repo small.

1. **Create an R2 bucket** called `ofwat-fd-data` in your Cloudflare account.

2. **Upload data to R2**:
   ```bash
   aws s3 cp public/data/ s3://ofwat-fd-data/data/ \
     --recursive \
     --endpoint-url https://<account-id>.r2.cloudflarestorage.com
   ```

3. **Set GitHub Actions secrets** (Settings → Secrets and variables → Actions):

   | Secret | Value |
   |--------|-------|
   | `CLOUDFLARE_API_TOKEN` | API token with Pages:Edit permission |
   | `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID |
   | `R2_BUCKET_NAME` | `ofwat-fd-data` |
   | `R2_ENDPOINT_URL` | `https://<account-id>.r2.cloudflarestorage.com` |
   | `R2_ACCESS_KEY_ID` | R2 API token access key |
   | `R2_SECRET_ACCESS_KEY` | R2 API token secret key |

4. **Push to `main`** — the GitHub Actions workflow handles build → R2 data pull → Cloudflare Pages deploy automatically.

## Data sources

All data originates from **Ofwat's PR24 Final Determination**, published December 2024. The source Excel models are publicly available on the [Ofwat website](https://www.ofwat.gov.uk/regulated-companies/price-review/2024-price-review/final-determinations/).

---

Built with React 18, Vite, Tailwind CSS, and Recharts.
