/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_API_BASE_URL?: string
	readonly VITE_GOOGLE_CLIENT_ID?: string
	readonly REACT_APP_API_BASE_URL?: string
	readonly REACT_APP_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
