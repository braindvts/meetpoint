import Foundation

/// Where the iPhone app loads Conclave from.
enum ConclaveConfig {
    /// Next.js on this Mac (`npm run dev`). Simulator can use 127.0.0.1.
    /// On a physical iPhone, 127.0.0.1 is the phone — put your Mac’s Wi-Fi IP here
    /// (System Settings → Network → Wi-Fi → Details).
    static let macHost = "127.0.0.1"
    static let macPort = 3000

    /// Set this to your live Vercel URL when you have one, e.g.
    /// `URL(string: "https://your-app.vercel.app")!`
    static let liveSiteURL: URL? = nil

    static var startURL: URL {
        if let live = liveSiteURL {
            return live
        }
        var parts = URLComponents()
        parts.scheme = "http"
        parts.host = macHost
        parts.port = macPort
        return parts.url!
    }
}
