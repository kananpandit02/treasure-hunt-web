# Treasure Hunt Web App

This repository contains the code for a full-stack treasure hunt web application built with HTML, CSS, JavaScript, and Supabase.

## Final Folder Structure

```
/
|-- admin.html
|-- player.html
|-- admin.js
|-- player.js
|-- scanner.js
|-- supabase.js
|-- styles.css
|-- README.md
```

## Deployment Instructions

### Supabase Setup

1.  **Create a Supabase Project:** Go to [supabase.com](https://supabase.com), create an account or log in, and start a new project.
2.  **Get API Credentials:** In your project dashboard, go to `Settings` > `API`. You will find your Project URL and `anon` public key.
3.  **Configure the App:** Simply open the `admin.html` or `player.html` file in your browser. On the first load, you will be prompted to enter the Supabase URL and anon key you just copied. They will be saved in your browser's `localStorage` for future visits.
4.  **Create Tables:** Go to the `Table Editor` in your Supabase dashboard and create the following two tables:

    **Table: `teams`**

| Column Name | Type | Default Value | Is Nullable |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `uuid_generate_v4()` | No (Primary Key) |
| `created_at` | `timestamptz` | `now()` | No |
| `name` | `text` | | No |
| `solved_count`| `int4` | `0` | No |
| `solved_clues`| `jsonb` | `[]` | No |
| `last_updated`| `timestamptz` | `now()` | No |

**Table: `master_clues`**

| Column Name | Type | Default Value | Is Nullable |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `uuid_generate_v4()` | No (Primary Key) |
| `created_at` | `timestamptz` | `now()` | No |
| `clue_order` | `int4` | | No |
| `type` | `text` | | No |
| `transcript` | `text` | | No |
| `url` | `text` | | Yes |
| `answer` | `text` | | No |
| `digit` | `int4` | | No |

5.  **Enable Row Level Security (RLS):** For both tables, go to the `Authentication` > `Policies` tab and enable RLS.

6.  **Create RLS Policies:**
    *   Go to the `Table Editor`, select a table, and click on the `Row Level Security` tab.
    *   Create new policies from scratch using the SQL provided below.

    **Policies for `teams` table:**

    *   **Allow public read access:**
        ```sql
        CREATE POLICY "Allow public read access"
        ON public.teams
        FOR SELECT
        USING (true);
        ```
    *   **Allow admin full access:** (This assumes you have a way to identify admins, e.g., a custom claim. For simplicity here, we allow any authenticated user to modify, but you should lock this down in production).
        ```sql
        CREATE POLICY "Allow authenticated users to update"
        ON public.teams
        FOR UPDATE
        USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to insert"
        ON public.teams
        FOR INSERT
        WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to delete"
        ON public.teams
        FOR DELETE
        USING (auth.role() = 'authenticated');
        ```

    **Policies for `master_clues` table:**

    *   **Allow public read access:**
        ```sql
        CREATE POLICY "Allow public read access"
        ON public.master_clues
        FOR SELECT
        USING (true);
        ```
    *   **Allow admin full access:**
        ```sql
        CREATE POLICY "Allow admins to manage clues"
        ON public.master_clues
        FOR ALL
        USING (auth.role() = 'authenticated')
        WITH CHECK (auth.role() = 'authenticated');
        ```

7.  **Set up Admin User:**
    *   Go to `Authentication` > `Users` and create a new user. This will be your admin login.
    *   Use the email and password you just created to log in to the `admin.html` page.

### Netlify Deployment

1.  **Sign up for Netlify:** Create a free account at [netlify.com](https://www.netlify.com/).
2.  **Create a New Site:** From your Netlify dashboard, click "Add new site" -> "Import an existing project".
3.  **Connect to a Git Provider:** Connect to GitHub, GitLab, or Bitbucket where you have pushed your code.
4.  **Select Your Repository:** Choose the repository for your treasure hunt app.
5.  **Deployment Settings:**
    *   **Build command:** Leave this blank.
    *   **Publish directory:** Leave this as the root directory (`/`).
6.  **Deploy:** Click "Deploy site". Netlify will build and deploy your site. You'll get a public URL for both your `admin.html` and `player.html` pages (e.g., `your-site.netlify.app/admin.html`).
