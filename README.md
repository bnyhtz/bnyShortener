# Cloudflare Link Shortener

A powerful, self-hosted link shortener built with React, Vite, and Cloudflare Pages. This application allows you to create short, custom links and provides advanced features like metadata customization and link cloaking, all running on the Cloudflare serverless platform.

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

- **Framework preset:** `Vite` (If `Vite` is not available, select `None`).
- **Build command:** `npm run build`
- **Build output directory:** `dist`

Click **Save and Deploy**.

### 4. Create a KV Namespace

1.  In the Cloudflare dashboard, go to **Workers & Pages** > **KV**.
2.  Click **Create a namespace** and give it a name (e.g., `link-shortener-data`).

### 5. Bind the KV Namespace to Your Project

1.  Navigate to your newly created Pages project.
2.  Go to **Settings** > **Functions** > **KV namespace bindings**.
3.  Click **Add binding**.
4.  Set the **Variable name** to `LINKS`.
5.  Select the KV namespace you created in the previous step.
6.  Click **Save**. This will trigger a new deployment.

### 6. Add a Custom Domain

1.  In your Pages project, go to the **Custom domains** tab.
2.  Follow the instructions to set up a custom domain. This will typically involve adding a `CNAME` record in your DNS settings.

### 7. (Optional) Set a Password

1.  In your Pages project, go to **Settings** > **Variables and Secrets**.
2.  Under **Production**, click the **Add** button.
3.  A modal will appear. Enter `PASSWORD` as the **Variable name**.
4.  Enter your desired password as the **Value**.
5.  For the **Type**, select **Secret**. This is the most important step as it encrypts your password.
6.  Click **Save**.
7.  Redeploy your application for the changes to take effect.

## Usage

Once deployed, you can start creating short links immediately by visiting your domain.

- **Destination URL:** The long URL you want to shorten.
- **Short link:** The custom path for your short link (e.g., `my-link`). This is optional.
- **Advanced settings:**
    - **Enable link previews:** Control whether social media platforms can generate a preview of the link.
    - **Enable custom metadata:** Override the default title, description, and image for link previews.
    - **Enable link cloaking:** Mask the destination URL. Note that this may not work for websites with strict security policies (like Google or Facebook).
