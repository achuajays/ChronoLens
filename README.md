# 🕰️ ChronoLens - AI Time Travel & Restoration Photo Booth

![image.png](image.png)

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Tech](https://img.shields.io/badge/React-19-61DAFB.svg)
![AI](https://img.shields.io/badge/Powered%20by-Gemini%202.5%20%26%203.0-8E75B2.svg)

**ChronoLens** is a sophisticated React web application that demonstrates the cutting-edge capabilities of the Google GenAI SDK. It functions as an intelligent "Photo Booth," allowing users to analyze, restore, edit, and completely reimagine their photos using the latest Gemini models.

---

## 🌟 Feature Deep Dive

### 1. 🚀 Time Travel (Image Generation)
The core feature of ChronoLens. It takes a user's selfie and transports them to a specific historical or futuristic era.
*   **Mechanism:** Uses `gemini-2.5-flash-image` for high-speed generation.
*   **Identity Preservation:** The prompt engineering is tuned to request that facial features remain consistent while the environment and attire change.
*   **Batch Processing:** Users can select multiple eras (e.g., "Viking" + "Cyberpunk"). The app iterates through them, generating a gallery of results in one session.

### 2. 🛠️ AI Photo Restoration
A professional workflow for repairing damaged photos.
*   **Step 1: Damage Detection (`gemini-3-pro-preview`):** The app first sends the image to the Pro model with a request to "analyze specifically for physical defects like scratches, tears, and fading."
*   **Step 2: Restoration (`gemini-2.5-flash-image`):** The analysis report is fed into the generation model as context. The prompt becomes: *"Restore this photograph... Fix the following issues: [Damage Report]"*. This two-step process ensures the AI knows exactly what to fix.

### 3. 🎨 Magic Edit (Inpainting)
An interactive canvas tool for targeted edits.
*   **Canvas Masking:** Users draw on their image using a specialized `MaskEditor` component.
*   **Binary Mask Generation:** The frontend converts the drawn strokes into a pure Black & White binary mask (White = Edit Area, Black = Keep).
*   **GenAI Call:** The Original Image, the Binary Mask, and the User's Prompt are sent to `gemini-2.5-flash-image`. The model performs seamless inpainting only within the white areas of the mask.

### 4. 🧠 Smart Analysis & Magic Prompts
*   **Context Analysis:** Uses `gemini-3-pro-preview` to describe the "vibe," clothing, and setting of a photo, suggesting which historical era the subject might accidentally fit into.
*   **Magic Prompt:** A "Prompt Engineer" mode where Gemini 3 Pro analyzes the image and writes a highly detailed, artistic prompt (describing lighting, lens type, depth of field) that users can then use to generate similar images.

### 5. 🎛️ Advanced Customization
*   **Style Engine:** Apply distinct aesthetic presets (e.g., *Cinematic, Oil Painting, Retro Futurism*) that append specific keywords and lighting instructions to the prompt.
*   **Resolution Control:** Switch between Standard, High, and 4K. This modifies the prompt to include keywords like "hyper-detailed," "4k resolution," or "masterpiece."
*   **Detail Slider:** A numerical input (0-100) that injects specific adjectives ranging from "soft, dreamy" to "intricate, sharp micro-details."

---

## 🏗️ Architecture & Tech Stack

### Frontend
*   **React 19:** Utilizing the latest hooks and concurrency features.
*   **Tailwind CSS:** Used for rapid styling, with custom keyframe animations (spinners, pulses, glassmorphism).
*   **Heroicons:** For UI iconography.

### AI Integration (`@google/genai`)
The app interacts with two specific models via `services/geminiService.ts`:

1.  **`gemini-2.5-flash-image`**: The workhorse.
    *   Used for: `timeTravel`, `customEdit`, `magicEdit`, `restore`.
    *   Why: Extremely fast latency and excellent visual fidelity.
2.  **`gemini-3-pro-preview`**: The brain.
    *   Used for: `analyzeImage`, `generateCreativePrompt`.
    *   Why: Superior reasoning and multimodal understanding capabilities.

### State Management
*   **React `useState` & `useReducer`:** Manages the app state machine (`HOME` -> `CAPTURE` -> `PREVIEW` -> `PROCESSING` -> `RESULT`).
*   **LocalStorage:** Persists user preferences (Selected Style, Resolution, Detail Level) so they don't reset on refresh.

---

## 💻 Installation & Setup

While the project is provided as individual files, here is how to reconstruct it in a modern development environment.

### Option 1: Using the provided `index.html` (No Build Tool)
The files provided are structured to run directly in environments that support ES Modules over CDN (like StackBlitz or specialized sandboxes).
1.  Ensure `metadata.json`, `index.html`, and the `.ts/.tsx` files are in the root.
2.  The `importmap` in `index.html` handles dependency loading.

### Option 2: Local Development (Recommended)
To run this locally with hot-reloading, use **Vite**.

1.  **Create Project:**
    ```bash
    npm create vite@latest chronolens -- --template react-ts
    cd chronolens
    ```

2.  **Install Dependencies:**
    ```bash
    npm install @google/genai @heroicons/react tailwindcss postcss autoprefixer
    ```

3.  **Configure Tailwind:**
    ```bash
    npx tailwindcss init -p
    ```
    *Update `tailwind.config.js` to match the configuration inside the `script` tag of the provided `index.html`.*

4.  **Copy Source Files:**
    *   Move `App.tsx`, `index.tsx` (rename to main.tsx if using Vite default), and `types.ts` to `src/`.
    *   Create `src/components/` and move `Camera.tsx`, `EraSelector.tsx`, `MaskEditor.tsx` there.
    *   Create `src/services/` and move `geminiService.ts` there.

5.  **Environment Variables:**
    Create a `.env.local` file in the root:
    ```env
    VITE_API_KEY=your_google_genai_api_key_here
    ```
    *Note: You will need to update `geminiService.ts` to use `import.meta.env.VITE_API_KEY` instead of `process.env.API_KEY` if using Vite.*

6.  **Run:**
    ```bash
    npm run dev
    ```

---

## 📂 File Structure Breakdown

| File | Purpose |
| :--- | :--- |
| **`App.tsx`** | **Main Controller.** Handles the primary state machine. Manages the flow between Camera, Preview, and Results. Handles global logic like audio playback and settings persistence. |
| **`services/geminiService.ts`** | **API Layer.** Contains all the logic for constructing prompts and calling the Google GenAI SDK. This is where the "prompt engineering" magic happens. |
| **`components/EraSelector.tsx`** | **Configuration UI.** A complex component containing the horizontal style carousel, the era selection grid, and the AI tools dashboard. |
| **`components/Camera.tsx`** | **Input Handling.** Manages WebRTC video streams. Includes robust error handling for permission denials and a fallback file upload mechanism. |
| **`components/MaskEditor.tsx`** | **Canvas Tool.** A dedicated overlay allowing users to draw on images. Handles coordinate mapping and binary mask generation. |
| **`types.ts`** | **Type Definitions.** Enums for `Eras`, `ImageStyles`, and interfaces for component props to ensure type safety. |

---

## 🛠️ Customization Guide

### Adding a New Era
1.  Open `types.ts` and add a new entry to the `Era` enum (e.g., `STEAMPUNK = 'Steampunk'`).
2.  Open `components/EraSelector.tsx` and add the era object to the `eras` array, including a label, description, and an emoji icon.

### Adding a New Style
1.  Open `types.ts` and add to `ImageStyle` enum.
2.  Open `services/geminiService.ts` and update the `getStylePrompt` switch statement to return the descriptive keywords for your new style.
3.  Open `components/EraSelector.tsx` and add it to the `styles` array with a corresponding Tailwind background class for the preview.

---

## ⚠️ Troubleshooting

### Camera "Permission Denied"
*   **Cause:** The browser blocked camera access.
*   **Fix:** Click the "Lock" icon in the URL bar, find "Camera", and set it to "Allow". Reload the page.
*   **Fallback:** Use the "Upload Instead" button provided in the error UI.

### "No image generated" Error
*   **Cause:** The AI model might have refused the prompt due to safety settings or an obscure input.
*   **Fix:** Try a different photo or a simpler prompt. Ensure the API key is valid and has access to the `gemini-2.5-flash-image` model.

### Mobile Layout Issues
*   The app is designed to be responsive. The Style Carousel becomes horizontally scrollable on mobile to save space. If buttons overlap, ensure you are not using an aggressive browser zoom.

---

## 📜 License
MIT License. Feel free to fork and modify for your own time-traveling adventures!
