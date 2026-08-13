Component({
  properties: { mode:{ type:String, value:'coffee' } },
  methods: {
    onChange(event: any) {
      const mode = event.currentTarget.dataset.mode
      if (mode !== this.data.mode) this.triggerEvent('change', { mode })
    }
  }
})
