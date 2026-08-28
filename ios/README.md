# Open Conclave in Xcode

This folder is an iPhone app that loads your Next.js site in a full-screen web view. It does not rewrite the website in Swift.

## On your Mac

**1. Pull the latest project** (if you cloned from GitHub):

```bash
cd ~/Documents/"AI App 1"
git pull
```

**2. Start the website** (leave this Terminal window open):

```bash
cd ~/Documents/"AI App 1"
npm install
npm run dev
```

Wait until you see `localhost:3000`.

**3. Open Xcode**

- Double-click `ios/Conclave.xcodeproj`
- Or in Xcode: **File → Open…** → pick that file

**4. Sign it with your Apple ID** (first time only)

1. Click the blue **Conclave** project in the left sidebar.
2. Select the **Conclave** target → **Signing & Capabilities**.
3. Check **Automatically manage signing**.
4. Team: **Add Account…** → sign in with your Apple ID → pick your Personal Team.

School Macs can use a free Apple ID. You do not need a paid developer account for the Simulator.

**5. Run it**

1. Top center: pick **iPhone 16** (or any iPhone simulator).
2. Press the **▶ Play** button (or ⌘R).

The simulator opens Conclave at `http://127.0.0.1:3000`. If the site is not running, the app shows a retry screen.

## Real iPhone

`127.0.0.1` is the phone itself, not your Mac. In `ios/Conclave/Config.swift` change `macHost` to your Mac’s Wi-Fi IP (System Settings → Network → Wi-Fi → Details), keep both devices on the same Wi-Fi, then Run with your iPhone selected.

## Live site later

When Conclave is on Vercel, set this in `Config.swift`:

```swift
static let liveSiteURL: URL? = URL(string: "https://YOUR-APP.vercel.app")
```

Then the iPhone app loads the live site and you do not need `npm run dev`.
