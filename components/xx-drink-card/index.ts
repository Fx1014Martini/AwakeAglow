Component({
  properties:{
    item:{ type:Object },
    mode:{ type:String, value:'coffee' },
    variant:{ type:String, value:'list' },
    favorite:{ type:Boolean, value:false },
    showCompare:{ type:Boolean, value:false },
    inCompare:{ type:Boolean, value:false },
    ctaText:{ type:String, value:'' }
  },
  data:{ imageSrc:'' },
  observers:{
    'item,variant': function(item:any,variant:string){
      const usePoster=variant==='hero'||variant==='hero-secondary'
      this.setData({imageSrc:item?(usePoster?(item.posterUrl||item.imageUrl):item.imageUrl):''})
    }
  },
  methods:{
    onOpen(){ if(this.data.item) this.triggerEvent('open',{ id:this.data.item.id }) },
    onFavorite(){ if(this.data.item) this.triggerEvent('favorite',{ id:this.data.item.id, favorite:!this.data.favorite }) },
    onCompare(){ if(this.data.item) this.triggerEvent('compare',{ id:this.data.item.id }) },
    onCta(){ if(this.data.item) this.triggerEvent('cta',{ id:this.data.item.id }) }
  }
})
