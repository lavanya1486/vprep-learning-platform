# VPrep Learning Platform

VPrep is a student-focused college resource hub for browsing course pages and
accessing notes, assignments, and previous-year questions.

## Features

- Course catalogue organized by programme and university categories.
- Individual subject pages with downloadable study materials.
- Decap CMS for managing subjects and uploaded resources.
- Static deployment support for Netlify and Vercel.
- Responsive layouts for desktop and mobile devices.

## Project structure

```text
.
├── index.html                 # Entry page and redirect to the main site
├── User/
│   ├── VPrepMain.html         # Main course catalogue
│   ├── VPrepMain.css          # Catalogue styles
│   ├── VPrepMain.js           # Catalogue interactions
│   ├── SubScript.js           # Subject-page materials loading
│   ├── SubStyle.css           # Subject-page styles
│   └── *.html                 # Subject pages
├── content/materials/         # CMS-managed subject JSON files
├── User/materials/            # Uploaded PDF and other study files
├── cms/
│   ├── index.html             # Decap CMS application
│   └── config.yml             # CMS and collection configuration
├── netlify.toml               # Netlify publish and redirect settings
└── vercel.json                # Vercel redirect settings
```

## Run locally

This is a static website and does not require a build step or package
installation. Serve the repository with any local static server, for example:

```powershell
py -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in a browser.

Opening files directly with `file://` is not recommended because browser
security rules can prevent material JSON files from loading.

## Deploy with Netlify

1. Import the GitHub repository into Netlify.
2. Set the publish directory to `.`.
3. Leave the build command empty.
4. Deploy the site.
5. Enable **Identity** for the site.
6. Set registration to **Invite only**.
7. Enable **Git Gateway** under Identity services.
8. Invite CMS users under **Identity → Users**.

The CMS is available at:

```text
https://your-domain.example/cms/
```

The `/admin` and `/cms` paths redirect to `/cms/`.

## Manage content with CMS

1. Sign in at `/cms/`.
2. Open **Course materials**.
3. Create or select a subject.
4. Add resources with a display name, type, PDF, and optional upload date.
5. Click **Save**, then **Publish**.
6. Wait for Netlify to redeploy.

CMS-managed subjects are stored as JSON files in `content/materials`, while
uploaded files are stored in `User/materials`.

The subject name in CMS should match the heading on its corresponding subject
page. The frontend converts the subject name to a lowercase kebab-case filename
when loading its materials JSON file.

## Contributing

1. Create a feature branch.
2. Make focused changes.
3. Test the affected pages locally.
4. Check the site on desktop and mobile layouts.
5. Open a pull request with a clear description.

## License

No license has been specified for this repository yet.
