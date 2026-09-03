# Deployment Guide: Netlify + Render + Supabase + Cloudinary

This project is a separated React/Vite frontend and Express/PostgreSQL backend.

- Frontend: Netlify
- Backend API: Render
- Database: Supabase PostgreSQL
- Media: Cloudinary

## 1. Prepare the code locally

From the project root:

```bash
npm install
npm run build
```

If the build passes, commit and push your project to GitHub.

```bash
git add .
git commit -m "Prepare deployment"
git push
```

## 2. Create the Supabase database

1. Go to `https://supabase.com`.
2. Create a new project.
3. Choose a strong database password and save it securely.
4. Wait for the project to finish provisioning.
5. Go to `Project Settings` > `Database`.
6. Copy the pooled connection string. Prefer the transaction/session pooler URL on port `6543` if available.
7. Replace `[YOUR-PASSWORD]` with your real database password.

Example:

```env
DATABASE_URL=postgresql://postgres.your-project-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres
DATABASE_SSL=true
```

You do not need to manually create the tables. The backend creates these tables automatically on startup:

- `submissions`
- `site_settings`

If you want to create them manually in Supabase SQL Editor, use:

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  consent BOOLEAN NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  category TEXT,
  categories TEXT[] DEFAULT '{}',
  license_number TEXT,
  license_body TEXT,
  county TEXT,
  coverage_mode TEXT,
  coverage_details TEXT,
  decline_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS submissions_email_index ON submissions (email);
CREATE INDEX IF NOT EXISTS submissions_phone_number_index ON submissions (phone_number);
```

## 3. Create Cloudinary media storage

1. Go to `https://cloudinary.com`.
2. Create or log in to your account.
3. Open the Cloudinary dashboard.
4. Copy these values:
   - Cloud name
   - API key
   - API secret
5. These will be added to Render environment variables:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Uploaded admin logo and favicon images will be sent to Cloudinary through the protected backend endpoint:

```text
POST /api/admin/media
```

## 4. Deploy backend to Render

1. Push the project to GitHub.
2. Go to `https://render.com`.
3. Click `New` > `Web Service`.
4. Connect your GitHub repository.
5. Use these settings:

```text
Name: kerea-listing-api
Runtime: Node
Root Directory: server
Build Command: npm install
Start Command: npm start
```

6. Add environment variables in Render:

```env
NODE_VERSION=20
PORT=10000
DATABASE_URL=your-supabase-connection-string
DATABASE_SSL=true
CLIENT_URL=https://your-netlify-site.netlify.app
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=use-a-strong-password
JWT_SECRET=use-a-long-random-secret-at-least-32-characters
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

7. Deploy the service.
8. After deployment, open:

```text
https://your-render-service.onrender.com/api/health
```

You should see:

```json
{
  "status": "ok",
  "databaseReady": true,
  "databaseError": ""
}
```

If `databaseReady` is false, re-check your Supabase `DATABASE_URL`, password, and `DATABASE_SSL=true`.

## 5. Deploy frontend to Netlify

1. Go to `https://netlify.com`.
2. Click `Add new site` > `Import an existing project`.
3. Connect your GitHub repository.
4. Use these build settings:

```text
Base directory: client
Build command: npm run build
Publish directory: client/dist
```

The repository also includes `netlify.toml`, so Netlify can detect these settings.

5. Add this environment variable in Netlify:

```env
VITE_API_URL=https://your-render-service.onrender.com
```

6. Deploy the site.
7. Copy the Netlify site URL.
8. Go back to Render and update:

```env
CLIENT_URL=https://your-custom-domain.example
CLIENT_URLS=https://your-custom-domain.example,https://your-netlify-site.netlify.app
```

9. Redeploy the Render backend after changing `CLIENT_URL` or `CLIENT_URLS`.

For the current live deployment, use these exact values:

```env
# Render backend
CLIENT_URL=https://ussd.kerea.org
CLIENT_URLS=https://ussd.kerea.org,https://kereaussd.netlify.app

# Netlify frontend
VITE_API_URL=https://kerea-listing-api.onrender.com
```

## 6. Test the live system

Test in this order:

1. Open the Render health URL:

```text
https://your-render-service.onrender.com/api/health
```

2. Open the Netlify frontend URL.
3. Click `Learn More` and confirm it scrolls to the Learn More / How it works section.
4. Submit a test listing.
5. Access admin through the hidden admin flow:
   - Open the form.
   - Enter the configured `ADMIN_EMAIL`.
   - Select `No, I prefer not to be listed`.
   - Continue.
   - Enter the admin password.
6. In admin, upload a logo and favicon.
7. Save settings.
8. Refresh the site and confirm settings persist.
9. Go to Responses.
10. Confirm long cells show only five values plus `Show more` as the sixth row.
11. Confirm multiple licenses show as paired values:

```text
1. EPRA-123 — EPRA
2. NCA-456 — NCA
```

12. Use `Copy all responses` and paste into a document.
13. Use `Export Excel` and open the file.

## 7. Important production notes

- Do not commit real `.env` files.
- Keep `ADMIN_PASSWORD`, `JWT_SECRET`, Supabase password, and Cloudinary API secret private.
- Supabase stores submissions and admin site settings.
- Cloudinary stores uploaded images.
- Netlify needs only `VITE_API_URL`.
- Render needs database, admin, JWT, CORS, and Cloudinary variables.
- If you change the Netlify URL later, update Render `CLIENT_URL` and redeploy the backend.

## 8. Troubleshooting

### Admin saves fail

Check:

- Render logs for backend errors.
- `CLIENT_URL` exactly matches your Netlify URL.
- `VITE_API_URL` exactly matches your Render URL.
- Supabase URL has the right password.
- `DATABASE_SSL=true` is set on Render.

### Form cannot submit

Check:

- Render health endpoint.
- Browser network tab for API errors.
- Supabase database connection.

### Logo upload fails

Check:

- Cloudinary environment variables on Render.
- Render was redeployed after adding Cloudinary variables.
- File is an image and under 3 MB.

### Netlify refresh gives 404

The included `netlify.toml` has an SPA redirect:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 9. Full deployment order without skipping steps

Use this exact order from start to finish:

1. Confirm the app builds locally with `npm run build`.
2. Confirm `client/.env.example` contains `VITE_API_URL`.
3. Confirm `server/.env.example` lists database, admin, JWT, CORS, and Cloudinary variables.
4. Push the project to GitHub.
5. Create the Supabase project.
6. Copy the Supabase PostgreSQL connection string.
7. Replace the placeholder password in the Supabase connection string.
8. Create the Cloudinary account.
9. Copy Cloudinary `Cloud name`, `API key`, and `API secret`.
10. Create the Render backend web service from the GitHub repo.
11. Set Render root directory to `server`.
12. Set Render build command to `npm install`.
13. Set Render start command to `npm start`.
14. Add all Render environment variables.
15. Deploy the Render backend.
16. Open Render `/api/health`.
17. Confirm `databaseReady` is `true`.
18. Create the Netlify frontend site from the GitHub repo.
19. Set Netlify base directory to `client`.
20. Set Netlify build command to `npm run build`.
21. Set Netlify publish directory to `client/dist`.
22. Add Netlify `VITE_API_URL` using the Render backend URL.
23. Deploy the Netlify frontend.
24. Copy the final Netlify URL.
25. Go back to Render.
26. Update Render `CLIENT_URL` to the final Netlify URL.
27. Redeploy Render.
28. Test the public homepage.
29. Test the homepage `Learn more` button.
30. Test the footer `Learn more` button from the homepage.
31. Test the footer `Learn more` button from the form/success pages.
32. Submit a live test response.
33. Confirm the response appears in Supabase.
34. Log into the hidden admin flow.
35. Test the admin responses table.
36. Test `Show more` and `Show less`.
37. Test `Copy row`.
38. Test `Copy all responses`.
39. Test Excel export.
40. Upload a logo or favicon in admin branding.
41. Confirm the uploaded media appears in Cloudinary.
42. Save admin settings.
43. Refresh the live site.
44. Confirm admin settings persist.

## 10. Exact Render settings

In Render, create a `Web Service` and use:

```text
Name: kerea-listing-api
Runtime: Node
Root Directory: server
Build Command: npm install
Start Command: npm start
Health Check Path: /api/health
```

Render environment variables:

```env
NODE_VERSION=20
PORT=10000
DATABASE_URL=your-supabase-connection-string
DATABASE_SSL=true
CLIENT_URL=https://your-netlify-site.netlify.app
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=use-a-strong-password
JWT_SECRET=use-a-long-random-secret-at-least-32-characters
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

For the first Render deploy, if Netlify is not ready yet, you may temporarily set:

```env
CLIENT_URL=http://localhost:5173
```

After Netlify is deployed, change `CLIENT_URL` to the real Netlify URL and redeploy Render.

## 11. Exact Netlify settings

In Netlify, import the same GitHub repository and use:

```text
Base directory: client
Build command: npm run build
Publish directory: client/dist
```

Netlify environment variable:

```env
VITE_API_URL=https://your-render-service.onrender.com
```

Do not add these to Netlify:

- `DATABASE_URL`
- `ADMIN_PASSWORD`
- `JWT_SECRET`
- `CLOUDINARY_API_SECRET`

Those are backend secrets and belong only in Render.

## 12. Exact Supabase steps

1. Open Supabase.
2. Create a new project.
3. Save the database password.
4. Open `Project Settings`.
5. Open `Database`.
6. Copy the connection string.
7. Prefer the pooled connection string on port `6543`.
8. Replace the password placeholder.
9. Use the result as Render `DATABASE_URL`.
10. Set Render `DATABASE_SSL=true`.

The backend automatically creates:

- `submissions`
- `site_settings`

If you want to create them manually, use Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  consent BOOLEAN NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  category TEXT,
  categories TEXT[] DEFAULT '{}',
  license_number TEXT,
  license_body TEXT,
  county TEXT,
  coverage_mode TEXT,
  coverage_details TEXT,
  decline_reason TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY,
  settings JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS submissions_email_index ON submissions (email);
CREATE INDEX IF NOT EXISTS submissions_phone_number_index ON submissions (phone_number);
```

## 13. Exact Cloudinary steps

1. Open Cloudinary.
2. Create an account or sign in.
3. Open the dashboard.
4. Copy `Cloud name`.
5. Copy `API key`.
6. Copy `API secret`.
7. Add all three values to Render.
8. Redeploy Render.
9. Log into admin.
10. Open `Branding`.
11. Upload a logo or favicon.
12. Save settings.
13. Confirm the Cloudinary dashboard shows the uploaded image.

Uploaded images are sent through this protected backend route:

```text
POST /api/admin/media
```

## 14. Live testing checklist

After all deployments:

1. Open `https://your-render-service.onrender.com/api/health`.
2. Confirm the backend says `status: ok`.
3. Open the Netlify URL.
4. Click homepage `Learn more`.
5. Confirm it scrolls to the Learn More section.
6. Open the form page.
7. Click footer `Learn more`.
8. Confirm it navigates to the homepage and scrolls.
9. Submit a test response.
10. Confirm Supabase contains the response.
11. Enter the hidden admin flow.
12. Open `Responses`.
13. Confirm long rows collapse.
14. Confirm `Coverage` shows one coverage entry first.
15. Confirm `Show more` reveals all coverage entries.
16. Confirm `Show less` collapses again.
17. Confirm multiple licenses are paired with license bodies.
18. Export Excel.
19. Copy all responses.
20. Upload Cloudinary media.
21. Save settings.
22. Refresh and confirm settings persist.
