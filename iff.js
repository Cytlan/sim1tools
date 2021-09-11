//
//
//
//

const Reader = require('./reader.js')
const Chunk = require('./chunks/chunk.js')
const GameObject = require('./object.js')
const SimAntics = require('./simantics.js')

class IFF
{
	constructor(file)
	{
		this.file = file
		this.chunks = {}
	}

	async readFile()
	{
		await this.file.load()

		this.file.bigEndian()
		this.header     = await this.file.readCString()
		this.comment    = await this.file.readString(25)
		this.rsmpOffset = await this.file.read32()

		if(this.header != 'IFF FILE 2.5:TYPE FOLLOWED BY SIZE' && this.header != 'IFF FILE 2.0:TYPE FOLLOWED BY SIZE')
			throw new Error('Invalid IFF file')

		await this.readChunks()
	}

	async readChunks()
	{
		while(!this.file.eof())
		{
			let chunk = await Chunk.factory(this.file)

			if(!this.chunks[chunk.type])
				this.chunks[chunk.type] = {}
			if(this.chunks[chunk.type][chunk.id])
			{
				//throw new Error('Chunk ID conflict: '+chunk.type+' '+chunk.id)
			}
			this.chunks[chunk.type][chunk.id] = chunk

			//console.log(chunk)
			//if(chunk.type == 'OBJD')
			//	console.log(chunk.data.masterId+' - '+chunk.data.slaveId+' - '+chunk.data.baseGraphic)
			//if(chunk.type == 'PALT')
			//	console.log(chunk)
		}


		//this.renderSprite(101)
		let objs = this.getObjects()
		for(let i in objs)
		{
			if(objs[i].definition.guid != 0x0e82c943)
				continue

			let simantics = new SimAntics()
			console.log(this.chunks.BHAV['4131'])
			simantics.decompile(this.chunks.BHAV['4131'])

			return
			//console.log(this.chunks)
			//for(let i in this.chunks.OBJD)
			//	console.log(this.chunks.OBJD[i].label)

			let guid = Buffer.alloc(4)
			guid.writeUInt32BE(objs[i].definition.guid)
			//console.log(guid.toString('hex') + ' - ' + objs[i].definition.label)
			//objs[i].render(0x04)
			let o = objs[i]
			for(let j in o.subObjects[1])
			{
				console.log(o.subObjects[1][j].initId)
				console.log(this.chunks.BHAV[o.subObjects[1][j].initId])
			}

			//return
		}
		//console.log(objs)
		//objs[2].render(0x10)
		//objs[2].render(0x01)
		//.pop()
		//let subObjs = this.getSubObjects(obj.masterId)
		//let object = {
		//	tiles: subObjs
		//}
		//this.renderObject(object)
		//let size = this.calculateObjectTileSize(subObjs)
		//let size2 = this.calculateObjectImageSize(subObjs, 0x4, 3)
		//console.log(JSON.stringify(this.chunks))
	}

	getObjects()
	{
		let objects = {}
		for(let i in this.chunks.OBJD)
		{
			let objd = this.chunks.OBJD[i]
			if(objd.slaveId == 65535 || objd.masterId == 0)
				objects[objd.masterId] = new GameObject(objd, this)
		}
		for(let i in this.chunks.OBJD)
		{
			let objd = this.chunks.OBJD[i]
			if(objd.slaveId != 65535 && objd.masterId != 0)
				objects[objd.masterId].addSubObject(objd)
		}
		return objects
	}

	getSubObjects(masterId)
	{
		let subObjects = []
		for(let i in this.chunks.OBJD)
		{
			let objd = this.chunks.OBJD[i]
			if(objd.masterId != masterId || objd.slaveId == 65535)
				continue
			let x = objd.slaveId & 0xFF
			let y = (objd.slaveId >> 8) & 0xFF
			if(!subObjects[x])
				subObjects[x] = []
			subObjects[x][y] = objd.label
			//console.log('x: '+(objd.slaveId & 0xFF)+', y: '+((objd.slaveId >> 8) & 0xFF))
			//if(objd.slaveId)
		}
		//console.log(subObjects)
		return subObjects
	}

	renderObject(object)
	{

	}

	calculateObjectTileSize(subObjs)
	{
		let w = -1
		let h = -1
		for(let i in subObjs)
		{
			let objd = subObjs[i]
			let x = objd.slaveId & 0xFF
			let y = (objd.slaveId >> 8) & 0xFF
			if(x > w)
				w = x
			if(y > h)
				h = y
		}
		return {
			w: w,
			h: h
		}
	}

	blend(fg0, fg1, fg2, fg3, bg0, bg1, bg2, bg3)
	{
		let alpha = fg3 + 1
		let inv_alpha = 256 - fg3
		let result = []
		result[0] = ((alpha * fg0 + inv_alpha * bg0) >> 8) & 0xff
		result[1] = ((alpha * fg1 + inv_alpha * bg1) >> 8) & 0xff
		result[2] = ((alpha * fg2 + inv_alpha * bg2) >> 8) & 0xff
		result[3] = 0xff
		return result
	}

	calculateObjectImageSize(subObjs, dir, zoom)
	{
		let size = this.calculateObjectTileSize(subObjs)
		let minY = 1024
		let maxY = -1024
		let minX = 1024
		let maxX = -1024
		for(let i in subObjs)
		{
			let objd = subObjs[i]

			let tileX = size.h - (objd.slaveId & 0xFF)
			let tileY = size.w - ((objd.slaveId >> 8) & 0xFF)

			let dgrp = this.chunks.DGRP[objd.baseGraphic]
			let sprInfo = dgrp.getSprite(dir, zoom, 0)
			let spr = this.chunks.SPR2[sprInfo.sprId].sprites[sprInfo.frame]

			//this.renderSprite(sprInfo.sprId, sprInfo.frame)

			let x = (tileX*64) - (tileY*64)
			let y = (tileX*32) + (tileY*32)

			if(x - 68 < minX)
				minX = x - 68
			if(x + 68 > maxX)
				maxX = x + 68
			if(y - 192 < minY)
				minY = y - 192
			if(y + 192 > maxY)
				maxY = y + 192

			console.log('Sprite: '+sprInfo.sprId+'.'+sprInfo.frame+'.png')
			console.log('X: '+x+' ('+tileX+')')
			console.log('Y: '+y+' ('+tileY+')')
			console.log()
		}

		let w = maxX - minX
		let h = maxY - minY
		let bitmap = Buffer.alloc(w * h * 4)
		for(let i = 0; i < w * h * 4; i++)
			bitmap[i] = 0

		for(let i in subObjs)
		{
			let objd = subObjs[i]

			let tileX = size.h - (objd.slaveId & 0xFF)
			let tileY = size.w - ((objd.slaveId >> 8) & 0xFF)

			let dgrp = this.chunks.DGRP[objd.baseGraphic]
			let sprInfo = dgrp.getSprite(dir, zoom, 0)
			let spr = this.chunks.SPR2[sprInfo.sprId]
			let pal = this.chunks.PALT[spr.paletteId]

			let sprBitmap = spr.render(pal, sprInfo.frame)

			let x = ((tileX*64) - (tileY*64)) - minX
			let y = (h - 384) - ((tileX*32) + (tileY*32))

			let off = (x + (y * w)) * 4
			console.log(w, h, x, y)

			let pixelLen = Math.floor(sprBitmap.data.length)
			for(let j = 0; j < pixelLen; j += 4)
			{
				let o = off + (Math.floor(j / (136 * 4) ) * w * 4) + Math.floor(j % (136*4))
				//let o = off + j
				if(bitmap[o+3] == 0)
				{
					bitmap[o]   = sprBitmap.data[j]
					bitmap[o+1] = sprBitmap.data[j+1]
					bitmap[o+2] = sprBitmap.data[j+2]
					bitmap[o+3] = sprBitmap.data[j+3]
				}
			}
		}

		console.log('W: '+w)
		console.log('Y: '+h)
		console.log('bmp: '+(w*h*4))
		//console.log(bitmap.toString('hex'))

		let png = new pngjs.PNG({width: w, height: h})
		png.data = bitmap
		let buf = pngjs.PNG.sync.write(png)
		fs.writeFileSync('obj.png', buf)

	}

	renderSprite(sprId, frame)
	{
		let spr = this.chunks.SPR2[sprId]
		if(!spr)
			throw new Error('SPR2 '+sprId+' does not exist')
		let pal = this.chunks.PALT[spr.paletteId]
		let bitmap = spr.render(pal, frame)
		let png = new pngjs.PNG({width: bitmap.width, height: bitmap.height})
		png.data = bitmap.data
		let buf = pngjs.PNG.sync.write(png)
		fs.writeFileSync(sprId+'.'+frame+'.png', buf)
	}

	repackage(callback)
	{

	}

}

module.exports = IFF
