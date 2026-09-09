Fonts directory

Place the downloaded WOFF2 font files here. You can run the included script to download the exact files used by the site:

On macOS/Linux:

```bash
chmod +x download-fonts.sh
./download-fonts.sh
```

This will create `fonts/fonts-local.css` containing @font-face rules that reference the downloaded WOFF2 files.

After running the script, I'll (optionally) inject the generated @font-face rules into `style.css` so everything is served locally.
