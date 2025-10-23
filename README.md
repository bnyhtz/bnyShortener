# Serverless Link Shortener for Cloudflare Pages

A powerful, self-hosted link shortener built with React, Vite, and Cloudflare Pages. This application allows you to create short, custom links and provides advanced features like metadata customization and link cloaking, all running on the Cloudflare serverless platform.

<img width="500" height="757" alt="image" src="https://github.com/user-attachments/assets/5982c6ee-d5fd-43f9-b283-e0b23d27a116" />

## Features

- **Custom Short Links:** Create personalized short links (e.g., `yourdomain.com/my-event`).
- **Random Link Generation:** Automatically generate a unique short path if no custom path is provided.
- **Link Cloaking:** Mask the destination URL by displaying the content within an iframe on your own domain.
- **Custom Social Media Previews:** Override the default title, description, and image for link previews on social media platforms.
- **Mobile-Friendly:** Responsive design that works on all devices.
- **404 Page:** A user-friendly "Not Found" page for any links that don't exist.
- **Serverless Deployment:** Runs entirely on the Cloudflare network, with no servers to manage.
- **Optional Password:** You can set a password so only you can use your link shortener.

## Tech Stack

- **Frontend:** React, Vite
- **Backend & Hosting:** Cloudflare Pages, Cloudflare Functions
- **Database:** Cloudflare KV

## Deployment Guide

Follow these steps to deploy your own instance of the link shortener on Cloudflare Pages.

### 1. Fork the Repository

Start by forking this repository to your own GitHub account.

### 2. Create a Cloudflare Pages Project

1.  Log in to your [Cloudflare dashboard](https://dash.cloudflare.com).
2.  Go to **Workers & Pages** > **Create application** > **Pages**.
3.  Connect your GitHub account and select the forked repository.

### 3. Configure the Build Settings

Use the following build settings for your project:

- **Framework preset:** `Vite`
- **Build command:** `npm run build`
- **Build output directory:** `dist`

Click **Save and Deploy**.

### 4. Create a KV Namespace

1.  In the Cloudflare dashboard, go to **Storage & databases** > **Workers KV**.
2.  Click **Create Instance** and give it a name (e.g., `link-shortener-data`).

### 5. Bind the KV Namespace to Your Project

1.  Navigate to your newly created Pages project.
2.  Go to **Settings** > **Bindings** > **Add** > **KV namespace**.
3.  Set the **Variable name** to `LINKS`.
4.  Select the KV namespace you created in the previous step.
5.  Click **Save**.

### 6. Add a Custom Domain

1.  In your Pages project, go to the **Custom domains** tab.
2.  Follow the instructions to set up a custom domain. This will typically involve adding a `CNAME` record in your DNS settings.

### 7. (Optional) Set a Password
1.  In your Pages project, go to **Settings** > **Variables and Secrets**.
2.  Click **Add**.
3.  Set the Type to **Secret**.
4.  Set the Variable name to `PASSWORD`.
5.  Set the Value to your preferred password.
6.  Go back to **Deployments** and click on **"View Details"** on the Production Deployment.
7.  Click **"Manage Deployment"** and click **"Retry Deployment**" (THIS IS IMPORTANT FOR THE PASSWORD TO TAKE EFFECT!)

## Usage

Once deployed, you can start creating short links immediately by visiting your domain.

- **Destination URL:** The long URL you want to shorten.
- **Short link:** The custom path for your short link (e.g., `my-link`). This is optional.
- **Advanced settings:**
    - **Enable link previews:** Control whether social media platforms can generate a preview of the link.
    - **Enable custom metadata:** Override the default title, description, and image for link previews.
    - **Enable link cloaking:** Mask the destination URL. Note that this may not work for websites with strict security policies (like Google or Facebook).

## Manage dashboard (/dash)

The project now includes a management dashboard available at the `/dash` path. Visit `https://your-deployed-site/dash` to open it.

- View all stored short links (server-side listing).
- Filter links by domain using the domain dropdown.
- Search links by short path or original URL.
- Edit the destination URL for a short link (admin action — requires password if `PASSWORD` is set).
- Delete a short link (admin action — requires password if `PASSWORD` is set).

Edits performed within the dashboard use the same backend APIs as link creation (PUT to `/api/links`), and deletion uses DELETE `/api/links`. If you configured the optional `PASSWORD` environment secret, the dashboard will prompt you to enter it before performing admin actions.

Note: the server-side listing currently returns up to 1000 keys from KV. If you have many links you may want to add pagination/cursor support.

## API: list, edit, delete

- `GET /api/list-links` — Returns a JSON array of stored links. Supports optional query parameter `?domain=example.com` to filter results by domain.
- `PUT /api/links` — Update an existing link's destination. Admin password required if `PASSWORD` is set. Admin edits bypass the 5-minute editable window.
- `DELETE /api/links` — Delete a stored short link. Admin password required if `PASSWORD` is set.

When performing admin operations (edit/delete) via direct API calls, include the header `X-Link-Shortener-Password: <your-password>` if you configured `PASSWORD` as a secret in your Pages project.

## Screenshots

Create link view:

![Create view](/assets/screenshot-create.svg)

Dashboard view (/dash):

![Dashboard view](/assets/screenshot-dash.svg)
