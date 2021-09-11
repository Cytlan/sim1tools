//
//
//
//

const MyObjectScope = [
	'Graphic','Direction','ContainerID','SlotNumber','AllowedHeightFlags','WallAdjacencyFlags','RouteID',
	'RoomImpact','Flags','RoutePreference','RoutePenalty','ObjectID','TargetID','WallPlacementFlags',
	'SlotHierNumber','RepairState','LightSource','WalkStyle','SimAge','UnusedGender','TreeTableEntry',
	'BirthMinute','Speed','RotationNotches','BirthHour','LockoutCount','ParentID','Weight','SupportStrength',
	'Room','RoomPlacement','PrepValue','CookValue','SurfaceValue','Hidden','Temperature','DisposeValue',
	'WashDishValue','EatingSurfaceValue','DirtyLevel','FlagField2','Unused41','PlacementFlags','MovementFlags',
	'MaximumGrade','BirthYear','BirthMonth','BirthDay','AgeInMonths','Size','HideInteraction','LightingContribution',
	'PrimitiveResult','WallBlockFlags','PrimitiveResultID','GlobalWearRepairState','AgeInvenQtrDaysStart',
	'AgeQtrDays','ObjectVersion','Category','SimIndependent','ServingSurfaceValue','UseCount','ExclusivePlacementFlags',
	'GardeningValue','WashHandsValue','FunctionScore','SlotCount','PersistedFlags','kUnused_RandomSeedLO','SalePriceHi',
	'SalePriceLo','GroupID','Reserved73','Reserved74','Reserved75','Reserved76','Reserved77','Reserved78','Reserved79',
]

const Scopes = [
	'kMyself','kTreeParam','kTargetObj','kMyData','kTreeParamData','kTargetObjData','kSimGlobals',
	'kImmediate','kTempVars','kStackVars','kStackObject','kTempTempVars','kStackObjTreeTableAdvertisement',
	'kTreeParamTemps','kPersonMotive','kStackObjectMotive','kStackObjectSlot','kStackObjectMotiveOfTemp'
]

class SimAntics
{
	constructor()
	{

	}

	getScope(scope, index)
	{
		let scopeName = Scopes[scope]
		if(!scopeName)
			scopeName = scope
		if(scope == 7)
			return index
		if(scope == 3)
		{
			return scopeName+'.'+MyObjectScope[index]
		}
		if(scope == 0)
		{
			return scopeName+'.'+MyObjectScope[index]
		}
		else
			return scopeName+'.'+index
	}

	decompile(bhav)
	{
		for(let i in bhav.instructions)
		{
			let instruction = bhav.instructions[i]

			let tVal = instruction.tDest
			if(tVal == 255)
				tVal = 'return true'
			else if(tVal == 254)
				tVal = 'return false'
			else if(tVal == 253)
				tVal = 'throw'
			else
				tVal = 'goto '+tVal
			let fVal = instruction.fDest
			if(fVal == 255)
				fVal = 'return true'
			else if(fVal == 254)
				fVal = 'return false'
			else if(fVal == 253)
				fVal = 'throw'
			else
				fVal = 'goto '+fVal

			if(instruction.opcode > 255 && instruction.opcode < 4096)
			{
				console.log(i+': gfunc_'+instruction.opcode+'() ? '+tVal+' : '+fVal)
				continue
			}
			if(instruction.opcode >= 4096)
			{
				console.log(i+': lfunc_'+instruction.opcode+'() ? '+tVal+' : '+fVal)
				continue
			}
			if(instruction.opcode == 2)
			{
				let lData = instruction.data.readUint16LE(0)
				let rData = instruction.data.readUint16LE(2)
				let isSigned = instruction.data.readUint8(4)
				let operator = instruction.data.readUint8(5)
				let lOwner = instruction.data.readUint8(6)
				let rOwner = instruction.data.readUint8(7)

				let left = this.getScope(lOwner, lData)
				let right = this.getScope(rOwner, rData)

				let opStr
				switch(operator)
				{
					case 0:
						opStr = left+' > '+right
						break
					case 1:
						opStr = left+' < '+right
						break
					case 2:
						opStr = left+' == '+right
						break
					case 3:
						opStr = left+' += '+right
						break
					case 4:
						opStr = left+' -= '+right
						break
					case 5:
						opStr = left+' = '+right
						break
					case 6:
						opStr = left+' *= '+right
						break
					case 7:
						opStr = left+' /= '+right
						break
					case 8:
						opStr = left+' & (1 << '+right+')'
						break
					case 9:
						opStr = left+' |= (1 << '+right+')'
						break
					case 10:
						opStr = left+' &= ~(1 << '+right+')'
						break
					case 11:
						opStr = left+'++ < '+right
						break
					case 12:
						opStr = left+' %= '+right
						break
					case 13:
						opStr = left+' &= '+right
						break
					case 14:
						opStr = left+' >= '+right
						break
					case 15:
						opStr = left+' <= '+right
						break
					case 16:
						opStr = left+' != '+right
						break
					case 17:
						opStr = left+'-- > '+right
						break
					//case 18:
					//	opStr = left+' & '+right
					//	break
					default:
						opStr = operator+'?'
				}
				console.log(i+': '+opStr+' ? '+tVal+' : '+fVal)
			}
		}
	}
}

module.exports = SimAntics
