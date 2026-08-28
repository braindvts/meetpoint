import SwiftUI
import CoreLocation

@main
struct ConclaveApp: App {
    @StateObject private var locationGate = LocationGate()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
                .onAppear { locationGate.request() }
        }
    }
}

/// Asks for location so the web app’s city / nearby tables can work in WKWebView.
final class LocationGate: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let manager = CLLocationManager()

    override init() {
        super.init()
        manager.delegate = self
    }

    func request() {
        manager.requestWhenInUseAuthorization()
    }
}
