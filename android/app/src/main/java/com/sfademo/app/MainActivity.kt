package com.sfademo.app

import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.os.Bundle
import android.view.View
import android.webkit.GeolocationPermissions
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.sfademo.app.databinding.ActivityMainBinding

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    
    // Change this to your deployed live Vercel URL or external staging IP
    private val appUrl = "https://sfa-demo.codeagni.com"
    private val locationPermissionCode = 123
    private var pendingGeoCallback: GeolocationPermissions.Callback? = null
    private var pendingGeoOrigin: String? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupWebView()
        setupSwipeToRefresh()
        setupBackNavigation()
        setupOfflineRetry()

        loadApplication()
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun setupWebView() {
        val webSettings = binding.webView.settings
        
        // Critical: Enable JavaScript for Next.js and React execution
        webSettings.javaScriptEnabled = true
        
        // Critical: Enable database/localStorage features used by Supabase Auth and State
        webSettings.domStorageEnabled = true
        webSettings.databaseEnabled = true
        
        // Settings for general mobile WebView speed and visuals
        webSettings.useWideViewPort = true
        webSettings.loadWithOverviewMode = true
        webSettings.javaScriptCanOpenWindowsAutomatically = true
        webSettings.mediaPlaybackRequiresUserGesture = false
        
        // Location features for Check-in Geo-fencing
        webSettings.setGeolocationEnabled(true)

        binding.webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                binding.progressBar.visibility = View.VISIBLE
                binding.progressBar.progress = 0
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                binding.progressBar.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
                
                // Hide offline container and show webview on successful load
                binding.offlineContainer.visibility = View.GONE
                binding.swipeRefresh.visibility = View.VISIBLE
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                // Check if this error happened on the main resource page load
                if (request?.isForMainFrame == true) {
                    val errorCode = error?.errorCode
                    // System errors like: no internet, connection timeout, DNS lookup failed
                    if (errorCode == ERROR_HOST_LOOKUP || errorCode == ERROR_CONNECT || errorCode == ERROR_TIMEOUT) {
                        showOfflineView()
                    }
                }
            }
        }

        binding.webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView?, newProgress: Int) {
                binding.progressBar.progress = newProgress
                if (newProgress == 100) {
                    binding.progressBar.visibility = View.GONE
                } else {
                    binding.progressBar.visibility = View.VISIBLE
                }
            }

            // Handles location requests inside Next.js browser context
            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                if (origin != null && callback != null) {
                    handleLocationPermissionRequest(origin, callback)
                }
            }
        }
    }

    private fun handleLocationPermissionRequest(origin: String, callback: GeolocationPermissions.Callback) {
        val hasFine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
        val hasCoarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION)

        if (hasFine == PackageManager.PERMISSION_GRANTED || hasCoarse == PackageManager.PERMISSION_GRANTED) {
            // Already granted native permissions, pass it directly to webview
            callback.invoke(origin, true, false)
        } else {
            // Request native Android OS permissions
            pendingGeoCallback = callback
            pendingGeoOrigin = origin
            ActivityCompat.requestPermissions(
                this,
                arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION),
                locationPermissionCode
            )
        }
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<out String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == locationPermissionCode) {
            val granted = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
            pendingGeoCallback?.let { callback ->
                pendingGeoOrigin?.let { origin ->
                    callback.invoke(origin, granted, false)
                }
            }
            pendingGeoCallback = null
            pendingGeoOrigin = null
        }
    }

    private fun setupSwipeToRefresh() {
        binding.swipeRefresh.setColorSchemeResources(R.color.brand_primary, R.color.brand_secondary)
        binding.swipeRefresh.setOnRefreshListener {
            binding.webView.reload()
        }
    }

    private fun setupBackNavigation() {
        // Modern back button navigation callback
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (binding.webView.canGoBack()) {
                    binding.webView.goBack()
                } else {
                    // Disable callback to let default behavior exit the app
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })
    }

    private fun setupOfflineRetry() {
        binding.btnRetry.setOnClickListener {
            binding.offlineContainer.visibility = View.GONE
            binding.swipeRefresh.visibility = View.VISIBLE
            loadApplication()
        }
    }

    private fun loadApplication() {
        binding.webView.loadUrl(appUrl)
    }

    private fun showOfflineView() {
        binding.progressBar.visibility = View.GONE
        binding.swipeRefresh.isRefreshing = false
        binding.swipeRefresh.visibility = View.GONE
        binding.offlineContainer.visibility = View.VISIBLE
    }
}
