// Polyfill File for Node 18 — undici (used by puppeteer/chromium) references it
// at module load time, but File wasn't added as a global until Node 20.
import { Blob } from 'buffer'
if (typeof globalThis.File === 'undefined') {
  globalThis.File = class File extends Blob {
    #name
    #lastModified
    constructor(chunks, name, options = {}) {
      super(chunks, options)
      this.#name = name
      this.#lastModified = options.lastModified ?? Date.now()
    }
    get name() { return this.#name }
    get lastModified() { return this.#lastModified }
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // In Next.js 14, this must be under `experimental` — the top-level key
  // is only supported in Next.js 15+.
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  },
}

export default nextConfig
