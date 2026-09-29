import Foundation
import UIKit
import ExpoModulesCore

public final class ListlyShareModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ListlyShare")

    AsyncFunction("shareFileAsync") { (url: URL, mimeType: String, dialogTitle: String, promise: Promise) in
      guard FileManager.default.isReadableFile(atPath: url.path) else {
        throw ShareFileUnreadableException()
      }

      let activityController = UIActivityViewController(activityItems: [url], applicationActivities: nil)
      if !dialogTitle.isEmpty {
        activityController.title = dialogTitle
      }

      activityController.completionWithItemsHandler = { _, completed, _, error in
        if let error {
          promise.reject(error)
          return
        }
        promise.resolve(completed ? "saved" : "dismissed")
      }

      guard let currentViewController = appContext?.utilities?.currentViewController() else {
        throw MissingCurrentViewControllerException()
      }

      // Apple docs state that `UIActivityViewController` must be presented in a
      // popover on iPad https://developer.apple.com/documentation/uikit/uiactivityviewcontroller
      if UIDevice.current.userInterfaceIdiom == .pad {
        let viewFrame = currentViewController.view.frame
        activityController.popoverPresentationController?.sourceRect = CGRect(
          x: viewFrame.midX,
          y: viewFrame.maxY,
          width: 0,
          height: 0
        )
        activityController.popoverPresentationController?.sourceView = currentViewController.view
        activityController.modalPresentationStyle = .pageSheet
      }

      currentViewController.present(activityController, animated: true)
    }
    .runOnQueue(.main)
  }
}

internal class ShareFileUnreadableException: Exception {
  override var reason: String {
    "The file to share is not readable."
  }
}
