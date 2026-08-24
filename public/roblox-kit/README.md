# Ashley Experience Store — Roblox Studio kit

This web preview cannot be uploaded to Roblox. Roblox uses its own engine (Luau + Studio), not a browser 3D scene. This kit rebuilds the same showroom as Parts so you can publish it as an experience.

## What you need

1. A [Roblox account](https://www.roblox.com)
2. [Roblox Studio](https://create.roblox.com/landing) on a computer (Windows or Mac)
3. About 15 minutes

## Build the place (two pastes)

1. Open Studio → **New** → **Baseplate**
2. In Explorer, click **ServerScriptService** → plus → **Script**
   - Rename it `BuildShowroom`
   - Delete the default `print("Hello world")`
   - Paste the contents of `BuildShowroom.lua`
3. In Explorer, click **StarterGui** → plus → **ScreenGui**
   - Rename it `AshleyShop`
   - Set **ResetOnSpawn** = false
   - Plus on `AshleyShop` → **LocalScript**
   - Rename it `ShopClient`
   - Paste the contents of `ShopClient.lua`
4. Press **Play** (F5). You should spawn in the gallery. Walk up to a sofa and press **E**.
5. Press **Stop**. File → **Save to File** so you do not lose the place.

The build script runs every time the server starts and rebuilds the showroom (safe to press Play again).

## Publish to Roblox

1. File → **Publish to Roblox**
2. Name it something like `Ashley Experience Store`
3. Description: walkable furniture showroom — living, bedroom, dining, sleep, patio
4. Enable the devices you want (computer, phone, tablet)
5. Click **Create**

That saves it to your account as a **private** experience. You can play it yourself and share the link with friends.

### Make it public

- Complete the **Content & Maturity** questionnaire on the experience
- Check [public publish eligibility](https://create.roblox.com/settings/eligibility/public-publish) — Roblox now requires ID verification or a Roblox purchase to publish *public* experiences
- On the experience page: **Make Public**

Anyone can still publish for personal / private play.

## Branding note

Ashley is a trademark. A private demo for you is one thing; a public Roblox experience using the Ashley name, logo, and collection names as if it were official can be taken down. For a public game, get written permission or rebrand (original store name, original collection names, original look).

## Optional polish in Studio

- Lighting → Environment → add a sky and bump brightness
- Anchor is already set on built parts
- Replace box furniture with Toolbox meshes (search “sofa”, “bed”) and keep the same ProximityPrompts
- Add a DataStore later if you want bags to save across visits
