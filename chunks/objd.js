//
//
//
//

const Chunk = require('./chunk.js')

class OBJD extends Chunk
{
	constructor()
	{
		super()
		this.version              = 0
		this.initialStackSize     = 0
		this.baseGraphic          = 0
		this.countGraphics        = 0
		this.mainId               = 0
		this.gardeningId          = 0
		this.treeTableId          = 0
		this.interactionGroup     = 0
		this.objType              = 0
		this.masterId             = 0
		this.slaveId              = 0
		this.washHandsId          = 0
		this.animTableId          = 0
		this.guid                 = 0
		this.disabled             = 0
		this.portalId             = 0
		this.price                = 0
		this.bodyStringsId        = 0
		this.slotsId              = 0
		this.allowIntersectionId  = 0
		this.unknown1             = 0
		this.unknown2             = 0
		this.prepareFoodId        = 0
		this.cookFoodId           = 0
		this.placeOnSurfaceId     = 0
		this.disposeId            = 0
		this.eatFoodId            = 0
		this.pickUpFromSlotId     = 0
		this.washDishId           = 0
		this.eatingSurfaceId      = 0
		this.sitId                = 0
		this.standId              = 0
		this.salePrice            = 0
		this.initialDeprecation   = 0
		this.dailyDeprecation     = 0
		this.selfDeprecation      = 0
		this.deprecationLimit     = 0
		this.roomSort             = 0
		this.functionSort         = 0
		this.catalogStringsId     = 0
		this.isGlobalObject       = 0
		this.initId               = 0
		this.placeId              = 0
		this.userPickupId         = 0
		this.wallStyle            = 0
		this.loadId               = 0
		this.userPlaceId          = 0
		this.objectVersion        = 0
		this.roomChangedId        = 0
		this.motiveEffectsId      = 0
		this.cleanupId            = 0
		this.levelInfoRequestId   = 0
		this.catalogPopupId       = 0
		this.servingSurfaceId     = 0
		this.levelOffset          = 0
		this.shadow               = 0
		this.countAttributes      = 0
		this.cleanId              = 0
		this.queueSkippedId       = 0
		this.frontDirection       = 0
		this.wallAdjacencyChangId = 0
		this.mtLeadObject         = 0
		this.dynamicSpritesBaseId = 0
		this.countDynamicSprites  = 0
		this.chairEntryFlags      = 0
		this.tileWidth            = 0
		this.inhibitSuitCopying   = 0
		this.buildModeType        = 0
		this.originalGuid         = 0
		this.suitGuid             = 0
		this.pickupId             = 0
		this.thumbGraphic         = 0
		this.shadowFlags          = 0
		this.footprintMask        = 0
		this.dynamicMtUpdateId    = 0
		this.shadowBrightness     = 0
		this.repairId             = 0
		this.wallStyleSpriteId    = 0
		this.ratingHunger         = 0
		this.ratingComfort        = 0
		this.ratingHygiene        = 0
		this.ratingBladder        = 0
		this.ratingFun            = 0
		this.ratingRoom           = 0
		this.ratingSkillFlags     = 0
		this.countTypeAttributes  = 0
		this.miscFlags            = 0
		this.typeAttrGuid         = 0
		this.functionSubSort      = 0
		this.downtownSort         = 0
		this.keepBuying           = 0
		this.vacationSort         = 0
		this.resetLogAction       = 0
		this.communitySort        = 0
		this.dreamFlags           = 0
		this.renderFlags          = 0
		this.vitaBoyFlags         = 0
		this.studiotownSort       = 0
		this.magictownSort        = 0
		this.reserved1            = 0
		this.reserved2            = 0
		this.reserved3            = 0
	}

	async readChunk(reader)
	{
		this.version              = await reader.read32()
		this.initialStackSize     = await reader.read16()
		this.baseGraphic          = await reader.read16()
		this.countGraphics        = await reader.read16()
		this.mainId               = await reader.read16()
		this.gardeningId          = await reader.read16()
		this.treeTableId          = await reader.read16()
		this.interactionGroup     = await reader.read16()
		this.objType              = await reader.read16()
		this.masterId             = await reader.read16()
		this.slaveId              = await reader.read16()
		this.washHandsId          = await reader.read16()
		this.animTableId          = await reader.read16()
		this.guid                 = await reader.read32()
		this.disabled             = await reader.read16()
		this.portalId             = await reader.read16()
		this.price                = await reader.read16()
		this.bodyStringsId        = await reader.read16()
		this.slotsId              = await reader.read16()
		this.allowIntersectionId  = await reader.read16()
		this.unknown1             = await reader.read16()
		this.unknown2             = await reader.read16()
		this.prepareFoodId        = await reader.read16()
		this.cookFoodId           = await reader.read16()
		this.placeOnSurfaceId     = await reader.read16()
		this.disposeId            = await reader.read16()
		this.eatFoodId            = await reader.read16()
		this.pickUpFromSlotId     = await reader.read16()
		this.washDishId           = await reader.read16()
		this.eatingSurfaceId      = await reader.read16()
		this.sitId                = await reader.read16()
		this.standId              = await reader.read16()
		this.salePrice            = await reader.read16()
		this.initialDeprecation   = await reader.read16()
		this.dailyDeprecation     = await reader.read16()
		this.selfDeprecation      = await reader.read16()
		this.deprecationLimit     = await reader.read16()
		this.roomSort             = await reader.read16()
		this.functionSort         = await reader.read16()
		this.catalogStringsId     = await reader.read16()
		this.isGlobalObject       = await reader.read16()
		this.initId               = await reader.read16()
		this.placeId              = await reader.read16()
		this.userPickupId         = await reader.read16()
		this.wallStyle            = await reader.read16()
		this.loadId               = await reader.read16()
		this.userPlaceId          = await reader.read16()
		this.objectVersion        = await reader.read16()
		this.roomChangedId        = await reader.read16()
		this.motiveEffectsId      = await reader.read16()
		this.cleanupId            = await reader.read16()
		this.levelInfoRequestId   = await reader.read16()
		this.catalogPopupId       = await reader.read16()
		this.servingSurfaceId     = await reader.read16()
		this.levelOffset          = await reader.read16()
		this.shadow               = await reader.read16()
		this.countAttributes      = await reader.read16()
		this.cleanId              = await reader.read16()
		this.queueSkippedId       = await reader.read16()
		this.frontDirection       = await reader.read16()
		this.wallAdjacencyChangId = await reader.read16()
		this.mtLeadObject         = await reader.read16()
		this.dynamicSpritesBaseId = await reader.read16()
		this.countDynamicSprites  = await reader.read16()
		this.chairEntryFlags      = await reader.read16()
		this.tileWidth            = await reader.read16()
		this.inhibitSuitCopying   = await reader.read16()
		this.buildModeType        = await reader.read16()
		this.originalGuid         = await reader.read32()
		this.suitGuid             = await reader.read32()
		this.pickupId             = await reader.read16()
		this.thumbGraphic         = await reader.read16()
		this.shadowFlags          = await reader.read16()
		this.footprintMask        = await reader.read16()
		this.dynamicMtUpdateId    = await reader.read16()
		this.shadowBrightness     = await reader.read16()
		this.repairId             = await reader.read16()
		this.wallStyleSpriteId    = await reader.read16()
		this.ratingHunger         = await reader.read16()
		this.ratingComfort        = await reader.read16()
		this.ratingHygiene        = await reader.read16()
		this.ratingBladder        = await reader.read16()
		this.ratingFun            = await reader.read16()
		this.ratingRoom           = await reader.read16()
		this.ratingSkillFlags     = await reader.read16()
		this.countTypeAttributes  = await reader.read16()
		this.miscFlags            = await reader.read16()
		this.typeAttrGuid         = await reader.read32()
		this.functionSubSort      = await reader.read16()
		this.downtownSort         = await reader.read16()
		this.keepBuying           = await reader.read16()
		this.vacationSort         = await reader.read16()
		this.resetLogAction       = await reader.read16()
		this.communitySort        = await reader.read16()
		this.dreamFlags           = await reader.read16()
		this.renderFlags          = await reader.read16()
		this.vitaBoyFlags         = await reader.read16()
		this.studiotownSort       = await reader.read16()
		this.magictownSort        = await reader.read16()
		this.reserved1            = await reader.read16()
		this.reserved2            = await reader.read16()
		this.reserved3            = await reader.read16()
	}

	export()
	{
		return ''
	}
}

module.exports = OBJD
