import SwiftUI

struct ContentView: View {
    @State private var reloadToken = 0
    @State private var isLoading = true
    @State private var errorMessage: String?

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()

            ConclaveWebView(
                url: ConclaveConfig.startURL,
                reloadToken: reloadToken,
                isLoading: $isLoading,
                errorMessage: $errorMessage
            )
            .ignoresSafeArea()

            if isLoading, errorMessage == nil {
                ProgressView()
                    .tint(Color(red: 0.79, green: 0.66, blue: 0.38))
                    .scaleEffect(1.2)
            }

            if let errorMessage {
                VStack(spacing: 16) {
                    Text("Conclave")
                        .font(.custom("Georgia", size: 28))
                        .foregroundStyle(Color(red: 0.96, green: 0.94, blue: 0.90))
                    Text(errorMessage)
                        .font(.system(size: 15))
                        .multilineTextAlignment(.center)
                        .foregroundStyle(Color.white.opacity(0.72))
                        .padding(.horizontal, 28)
                    Button("Try again") {
                        self.errorMessage = nil
                        isLoading = true
                        reloadToken += 1
                    }
                    .buttonStyle(.borderedProminent)
                    .tint(Color(red: 0.79, green: 0.66, blue: 0.38))
                    .foregroundStyle(.black)
                }
                .padding(32)
                .background(Color.black.opacity(0.92))
            }
        }
    }
}

#Preview {
    ContentView()
}
