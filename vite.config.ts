import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: "/ORBITAL/", // nome del repository, maiuscole comprese
  plugins: [react()],
})
