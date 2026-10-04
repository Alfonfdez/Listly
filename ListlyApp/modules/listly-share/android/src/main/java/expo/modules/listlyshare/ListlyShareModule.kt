package expo.modules.listlyshare

import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.MediaStore
import androidx.core.content.FileProvider
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class ListlyShareModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private var pendingPromise: Promise? = null

  override fun definition() = ModuleDefinition {
    Name("ListlyShare")

    AsyncFunction("shareFileAsync") { url: String, mimeType: String, dialogTitle: String, promise: Promise ->
      if (pendingPromise != null) {
        throw ShareInProgressException()
      }
      val fileToShare = localFileForUrl(url)
      val contentUri = FileProvider.getUriForFile(
        context,
        context.applicationInfo.packageName + ".listlyshare.fileprovider",
        fileToShare
      )
      val intent = Intent.createChooser(
        Intent(Intent.ACTION_SEND).apply {
          putExtra(Intent.EXTRA_STREAM, contentUri)
          type = mimeType
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        },
        dialogTitle
      )
      pendingPromise = promise
      appContext.throwingActivity.startActivityForResult(intent, REQUEST_CODE)
    }

    AsyncFunction("saveToDownloadsAsync") { fileName: String, content: String, promise: Promise ->
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
        promise.resolve(false)
        return@AsyncFunction
      }
      val resolver = context.contentResolver
      val values = ContentValues().apply {
        put(MediaStore.Downloads.DISPLAY_NAME, fileName)
        put(MediaStore.Downloads.MIME_TYPE, "application/json")
        put(MediaStore.Downloads.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS)
        put(MediaStore.Downloads.IS_PENDING, 1)
      }
      val uri = resolver.insert(MediaStore.Downloads.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), values)
      if (uri == null) {
        promise.resolve(false)
        return@AsyncFunction
      }
      val stream = resolver.openOutputStream(uri)
      if (stream == null) {
        resolver.delete(uri, null, null)
        promise.resolve(false)
        return@AsyncFunction
      }
      stream.use { it.write(content.toByteArray(Charsets.UTF_8)) }
      values.clear()
      values.put(MediaStore.Downloads.IS_PENDING, 0)
      resolver.update(uri, values, null, null)
      promise.resolve(true)
    }

    OnActivityResult { _, (requestCode) ->
      if (requestCode != REQUEST_CODE) {
        return@OnActivityResult
      }
      val promise = pendingPromise
      pendingPromise = null
      if (promise != null) {
        promise.resolve(SHARE_RESULT_SAVED)
      }
    }
  }

  private fun localFileForUrl(url: String): File {
    val uri = Uri.parse(url)
    if (uri == null || uri.scheme != "file" || uri.path == null) {
      throw ShareInvalidUrlException()
    }
    return File(uri.path!!).also { file ->
      if (!file.exists()) {
        throw ShareFileNotFoundException()
      }
    }
  }

  companion object {
    private const val REQUEST_CODE = 9093
    private const val SHARE_RESULT_SAVED = "saved"
  }
}

internal class ShareInProgressException : CodedException("Another sharing request is already in progress.")
internal class ShareInvalidUrlException : CodedException("Only local file URLs are supported.")
internal class ShareFileNotFoundException : CodedException("The file to share does not exist.")
