# Open Conclave in Xcode

Do **not** open the `AI App 1` website folder in Xcode. That only lists files. It does not make an iPhone app.

## Fastest path on your Mac

1. Close any Xcode window that shows `package.json` or `app/admin`.
2. In **Terminal** (not Cursor):

```bash
python3 ~/Documents/"AI App 1"/ios/install-on-mac.py
```

If that says *No such file*, copy the `ios` folder from this project onto your Mac first, then run the command again.

That creates **Desktop/Conclave** and opens `Conclave.xcodeproj`.

3. In another Terminal window:

```bash
cd ~/Documents/"AI App 1"
npm run dev
```

4. In Xcode pick **iPhone 16** → press **▶**.

If Xcode asks for a Team, choose your Apple ID / Personal Team.
