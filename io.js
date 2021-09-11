//
// IO reader
//
//

var fs = require('fs');

var IO = function(data, options)
{
	// Data is currently assumed to be a Buffer or a filename string

	this.inc = true; // Consume the bytes read (increments the index)
	this.index = 0;  // Current offset in the file
	this.endian = 1; // 1: little-endian, 0: big-endian

	if(typeof data === 'string' || data instanceof String)
	{
		var stat = fs.statSync(data);
		if(!stat.isFile())
			throw "\"" + path + "\" isn't a file";
		this.dataSize = stat.size;

		// Open the file!
		this.fd = fs.openSync(data, 'r');

		// Prepare the cache
		// Caching happens in chunks of 2^x bytes (Bigger chunks are better. Caching makes random access slightly more expensive)
		this.cache          = {};
		this.cacheKeyShift  = 9; // 512 byte chunks
		this.cacheChunkSize = 1 << this.cacheKeyShift;
		this.cacheChunkMask = this.cacheChunkSize - 1;
		this.cacheStart     = 0; // The idea here is to let data be removed from the cache when it reaches a certain
		this.cacheSize      = 0; // size. Kinda like garbage collection. Not sure how to implement it yet, though.

		// Set the read callback to the cache
		this._read = this._readCache;

		// Load the first chunk from the file, so that we can start out with a valid currentChunkKey.
		var newChunk = this.loadChunkFromFile(0);
		this.currentChunk = newChunk;
		this.currentChunkKey = 0;
	}
	else
	{
		this.data = data;
		this.dataSize = data.length;
		this.cacheSize = this.dataSize;

		this._read = this._readPlain;
	}
}

IO.prototype.options = function(options)
{
	// Store the options as-is
	for(var i in options)
		this[i] = options[i];
}

IO.prototype.openFile = function(filename)
{
	throw new Error("File I/O not supported yet");
	this.filename = filename;
	this.fd = fs.openSync(filename, 'r');
}

IO.prototype._readPlain = function(pos)
{
	if(pos > this.dataSize)
		throw new Error("Out of boundary: " + pos + " > " + this.dataSize);
	return this.data[pos];
}

IO.prototype._readCache = function(pos)
{
	if(pos > this.dataSize)
		throw new Error("Out of boundary: " + pos + " > " + this.dataSize);

	// If the position is in the current chunk, return it, plain and simple
	var key = pos >> this.cacheKeyShift;
	var index = pos & this.cacheChunkMask;
	if(key == this.currentChunkKey)
		return this.currentChunk[index];
	else
	{
		// Is the chunk cached?
		var c = this.cache[key];
		if(c !== undefined)
		{
			// Set this cunk as the current one and return
			this.currentChunk = c;
			this.currentChunkKey = key;
			return c[index];
		}
		else
		{
			// Data isn't in our cache, we must read from the file
			var newChunk = this.loadChunkFromFile(pos);
			this.currentChunk = newChunk;
			this.currentChunkKey = key;
			return newChunk[index];
		}
	}
	return this.index;
}

IO.prototype.loadChunkFromFile = function(pos)
{
	var key = pos >> this.cacheKeyShift;
	var index = pos & this.cacheChunkMask;
	var filePos = pos & ~this.cacheChunkMask;

	var buf = new Buffer(this.cacheChunkSize);
	var bytesRead = fs.readSync(this.fd, buf, 0, this.cacheChunkSize, filePos);

	this.cacheSize += bytesRead;

	this.cache[key] = buf;
	return buf;
}

IO.prototype.littleEndian = function()
{
	return this.endian = 1;
}

IO.prototype.bigEndian = function()
{
	return this.endian = 0;
}

// Read bits
IO.prototype.readBits = function(bits)
{
	var ret = 0;
	while(bits)
	{
		ret = (ret << 1) | ((curData & 0x80) >> 7);
		curData <<= 1;
		curBits++;
		if(curBits == 8)
		{
			curBits = 0;
			curData = chunk.binary.read8();
		}
		bits--;
	}
	return ret;
}

// If count != 1, then an array will be returned
// otherwise an int will be returned
IO.prototype.read32 = function(count)
{
	if(!count) count = 1;
	var ret = new Array(count);
	var idx = this.index;
	for(var i = 0; i < count; i++)
	{
		var d = 0;
		if(this.endian)
		{
			d = this._read(idx++) |
			    (this._read(idx++) << 8) |
			    (this._read(idx++) << 16) |
			    (this._read(idx++) << 24);
		}
		else
		{
			d = (this._read(idx++) << 24) |
			    (this._read(idx++) << 16) |
			    (this._read(idx++) << 8) |
			    this._read(idx++);
		}
		ret[i] = d;
	}
	if(this.inc)
		this.index = idx;
	return count == 1 ? ret[0] : ret;
}

IO.prototype.read24 = function(count)
{
	if(!count) count = 1;
	var ret = new Array(count);
	var idx = this.index;
	for(var i = 0; i < count; i++)
	{
		var d = 0;
		if(this.endian)
		{
			d = this._read(idx++) |
			    (this._read(idx++) << 8) |
			    (this._read(idx++) << 16);
		}
		else
		{
			d = (this._read(idx++) << 16) |
			    (this._read(idx++) << 8) |
			    this._read(idx++);
		}
		ret[i] = d;
	}
	if(this.inc)
		this.index = idx;
	return count == 1 ? ret[0] : ret;
}

IO.prototype.read16 = function(count)
{
	if(!count) count = 1;
	var ret = new Array(count);
	var idx = this.index;
	for(var i = 0; i < count; i++)
	{
		var d = 0;
		if(this.endian)
		{
			d = this._read(idx++) |
			    (this._read(idx++) << 8);
		}
		else
		{
			d = (this._read(idx++) << 8) |
			    this._read(idx++);
		}
		ret[i] = d;
	}
	if(this.inc)
		this.index = idx;
	return count == 1 ? ret[0] : ret;
}

IO.prototype.read8 = function(count)
{
	if(!count) count = 1;
	var ret = new Array(count);
	var idx = this.index;
	for(var i = 0; i < count; i++)
	{
		ret[i] = this._read(idx++);
	}
	if(this.inc)
		this.index = idx;
	return count == 1 ? ret[0] : ret;
}

IO.prototype.readArray = function(count)
{
	var d = new Array(count);
	var idx = this.index;
	for(var i = 0; i < count; i++)
		d[i] = this._read(idx++);
	if(this.inc)
		this.index = idx;
	return d;	
}

IO.prototype.read = function(count)
{
	var d = new Uint8Array(count);
	var idx = this.index;
	for(var i = 0; i < count; i++)
		d[i] = this._read(idx++);
	if(this.inc)
		this.index = idx;
	return new IO(new Buffer(d));
}

IO.prototype.readString = function(count)
{
	var s = '';
	var idx = this.index;
	for(var i = 0; i < count; i++)
	{
		var c = this._read(idx++);
		if(c)
			s += String.fromCharCode(c);
		else
			break;
	}
	if(this.inc)
		this.index += count;
	return s;
}

IO.prototype.readHexString = function(count)
{
	var nibble = "0123456789ABCDEF";
	var s = '';
	var idx = this.index;
	for(var i = 0; i < count; i++)
	{
		var c = this._read(idx++);
		s += nibble[(c >> 4) & 0xF] + nibble[c & 0xF] + ' ';
	}
	if(this.inc)
		this.index += count;
	return s;
}

// For converting Windows-1252 encoding to whatever Javascript is running with (Hopefully utf-8!)
var windows1252 = [
	///////////////////////////////////////////////////////////////////////////////////////////////
	/*    /  0    1    2    3    4    5    6    7    8    9    A    B    C    D    E    F   /    */
	/* 0 */  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 , /* 0 */
	/* 1 */  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 ,  0 , /* 1 */
	/* 2 */ ' ', '!', '"', '#', '$', '%', '&', "'", '(', ')', '*', '+', ',', '-', '.', '/', /* 2 */
	/* 3 */ '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', ':', ';', '<', '=', '>', '?', /* 3 */
	/* 4 */ '@', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', /* 4 */
	/* 5 */ 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '[','\\', ']', '^', '_', /* 5 */
	/* 6 */ '`', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', /* 6 */
	/* 7 */ 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', '{', '|', '}', '~',  0 , /* 7 */
	/* 8 */ '€',  0 , '‚', 'ƒ', '„', '…', '†', '‡', 'ˆ', '‰', 'Š', '‹', 'Œ',  0 , 'Ž',  0 , /* 8 */
	/* 9 */  0 , '‘', '’', '“', '”', '•', '–', '—', '˜', '™', 'š', '›', 'œ',  0 , 'ž', 'Ÿ', /* 9 */
	/* A */ ' ', '¡', '¢', '£', '¤', '¥', '¦', '§', '¨', '©', 'ª', '«', '¬', '-', '®', '¯', /* A */
	/* B */ '°', '±', '²', '³', '´', 'µ', '¶', '·', '¸', '¹', 'º', '»', '¼', '½', '¾', '¿', /* B */
	/* C */ 'À', 'Á', 'Â', 'Ã', 'Ä', 'Å', 'Æ', 'Ç', 'È', 'É', 'Ê', 'Ë', 'Ì', 'Í', 'Î', 'Ï', /* C */
	/* D */ 'Ð', 'Ñ', 'Ò', 'Ó', 'Ô', 'Õ', 'Ö', '×', 'Ø', 'Ù', 'Ú', 'Û', 'Ü', 'Ý', 'Þ', 'ß', /* D */
	/* E */ 'à', 'á', 'â', 'ã', 'ä', 'å', 'æ', 'ç', 'è', 'é', 'ê', 'ë', 'ì', 'í', 'î', 'ï', /* E */
	/* F */ 'ð', 'ñ', 'ò', 'ó', 'ô', 'õ', 'ö', '÷', 'ø', 'ù', 'ú', 'û', 'ü', 'ý', 'þ', 'ÿ'  /* F */
	/*    /  0    1    2    3    4    5    6    7    8    9    A    B    C    D    E    F   /    */
	///////////////////////////////////////////////////////////////////////////////////////////////
];

// Read string until a null-terminator is hit
IO.prototype.readCString = function()
{
	var s = '';
	var idx = this.index;
	while(true)
	{
		var c = this._read(idx++);
		if(c > 0)
			s += windows1252[c];
		else
			break;
	}
	if(this.inc)
		this.index = idx;
	return s;
}

// TODO: Find a better way to align
IO.prototype.readCString2 = function()
{
	var s = '';
	var idx = this.index;
	while(true)
	{
		var c = this._read(idx++);
		if(c > 0)
			s += windows1252[c];
		else
			break;
	}
	if(idx & 1 != 0)
		idx++;
	if(this.inc)
		this.index = idx;
	return s;
}

IO.prototype.readFloat = function()
{
	// TODO: Fix me
	var d = this.read32(1);
	return d;

	//var buf = new FloatArray(buf))[0] = f;
    //return [ (new Uint32Array(buf))[0] ,(new Uint32Array(buf))[1] ];

	//var d = this.data.readFloatLE(this.index);
	//if(this.inc)
	//	this.index += 4;
	//return d;
}

// Deprecated: Use tell() instead
IO.prototype.getPos = function()
{
	throw "Deprecated function: IO.getPos()";
}

IO.prototype.size = function()
{
	return this.dataSize;
}

IO.prototype.tell = function()
{
	return this.index;
}

IO.prototype.rewind = function(count)
{
	if(count)
		this.index -= count;
	else
		this.index = 0;
}

IO.prototype.seek = function(seek)
{
	this.index = seek;
}

IO.prototype.skip = function(count)
{
	if(count)
		this.index += count;
	else
		this.index = this.dataSize;
}

IO.prototype.eof = function()
{
	return this.index >= this.dataSize;
}

// Validates that the value of f is found in the value or values specified.
IO.prototype.validate = function(o, f)
{
	var val = o[f.name];
	var arr = typeof f.value === 'object' ? f.value : [f.value];
	for(var i in arr)
	{
		if(val == arr[i])
			return true;
	}
	return false;
}

IO.prototype.parse = function(format, options)
{
	var stopOnEOF = options && options.stopOnEOF === true;
	var o = {};
	this.cur = o;

	for(var i = 0, n = format.length; i < n; i++)
	{
		var f = format[i];

		var size = 0;
		if(typeof f.size === 'string')
			size = o[f.size];
		else
			size = f.size ? f.size : 1;

		var data = null;

		// Read value
		switch(f.type)
		{
			case 'uint32':
				data = this.read32(size);
				break;
			case 'uint24':
				data = this.read24(size);
				break;
			case 'uint16':
				data = this.read16(size);
				break;
			case 'uint8':
				data = this.read8(size);
				break;
			case 'raw':
				data = this.read(size);
				break;
			case 'uint8_2':
				if(this.index & 1)
					data = this.read8(size);
				break;
			case 'float':
				data = this.readFloat();
				break;
			case 'string':
				data = this.readString(size);
				break;
			case 'cstring':
				data = this.readCString();
				break;
			case 'cstring2':
				data = this.readCString2();
				break;
			case 'custom':
				data = f.parser(this, o);
				if(!data)
					return null;
				if(!data.continue)
				{
					data = data.data
					break;
				}
				data = [data.data];
				while(1)
				{
					var d = f.parser(this, o);
					data.push(d.data);
					if(!d || !d.continue)
						break;
				}
				break;
			case 'padding':
				if(this.index & f.size != 0)
					this.index += f.size - (this.index & f.size);
				break;
		}
		if(f.subtype === 'array' && !(data instanceof Array))
			data = [data];
		if(f.name !== undefined)
			o[f.name] = data;
		if(f.padding && (f.padding & size) != 0)
			this.index++;


		// Validate value
		if(f.value && !this.validate(o, f))
			throw new Error(f.name + " is not " + f.value + ", got " + data + " instead");

		if(stopOnEOF && this.eof())
			break;
	}

	return o;
}

module.exports = IO;