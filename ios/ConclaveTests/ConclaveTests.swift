import XCTest
@testable import Conclave

final class ConclaveTests: XCTestCase {
    func testAppName() {
        XCTAssertEqual(AppConfig.appName, "Conclave")
    }

    func testDevServerHost() {
        XCTAssertEqual(AppConfig.devServerURL.host, "127.0.0.1")
    }

    func testDevServerPort() {
        XCTAssertEqual(AppConfig.devServerURL.port, 3000)
    }

    func testDevServerUsesHTTP() {
        XCTAssertEqual(AppConfig.devServerURL.scheme, "http")
    }

    // Add more tests below. Each method name must start with `test`.
    // Run them all in Xcode with Product → Test (⌘U).
}
