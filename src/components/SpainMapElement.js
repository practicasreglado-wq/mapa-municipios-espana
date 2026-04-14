import { createApp } from 'vue'
import SpainMap from './SpainMap.vue'
import '../assets/styles/global.css'
import '../assets/styles/neon.css'

export class SpainMapElement extends HTMLElement {
  #app = null

  connectedCallback() {
    // Create Vue app inside this element
    this.#app = createApp(SpainMap, {
      statusFile: this.dataset.statusFile || 'public/data/municipios-status.json'
    })

    this.#app.mount(this)
  }

  disconnectedCallback() {
    if (this.#app) {
      this.#app.unmount()
      this.#app = null
    }
  }
}

customElements.define('spain-map', SpainMapElement)
