import { Dimension, EntityComponentTypes, EquipmentSlot, ItemComponentTypes, ItemComponentUseEvent, ItemStack, Player, system, Vector3 } from "@minecraft/server";
import { MinecraftBlockTypes, MinecraftEnchantmentTypes } from "@minecraft/vanilla-data";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { PokeDamageItemUB, PokeSaveProperty } from "./commonFunctions";
const HaxelVersion:number = 2
const HaxelInfoProperty = `pfe:haxelInfo`
interface PFEHaxelConfig{
  "blacklist": string[];
  "v":undefined|typeof HaxelVersion
}
const PFEHaxelConfigDefault:PFEHaxelConfig = {
  "blacklist":[
    MinecraftBlockTypes.Chest,
    MinecraftBlockTypes.Barrel,
    MinecraftBlockTypes.BuddingAmethyst,
    MinecraftBlockTypes.MobSpawner,
    MinecraftBlockTypes.TrialSpawner,
    MinecraftBlockTypes.Vault,
    MinecraftBlockTypes.Bed
  ],
  "v": HaxelVersion
}
interface PFEHaxelComponentInfo {
  "radius": Vector3;
  "canBreakBedrock"?: boolean;
  "canBreakLiquids"?: boolean;
}
class PFEHaxelMining{
  onUse(data:ItemComponentUseEvent){
    if (!data.itemStack)return;
    //@ts-ignore
    let dynamicProperty:PFEHaxelConfig= data.itemStack.getDynamicProperty(HaxelInfoProperty)
    if(dynamicProperty == undefined){
      data.itemStack.setDynamicProperty(HaxelInfoProperty,JSON.stringify(PFEHaxelConfigDefault))
      data.source.getComponent(EntityComponentTypes.Equippable)!.setEquipment(EquipmentSlot.Mainhand, data.itemStack)
      dynamicProperty=PFEHaxelConfigDefault
      //@ts-ignore
    }else dynamicProperty=JSON.parse(dynamicProperty)
    const ItemTags = data.itemStack.getTags().toString();
    let ComponentInfo:PFEHaxelComponentInfo = JSON.parse(ItemTags.substring(ItemTags.indexOf('poke_pha:HaxelMining:'),ItemTags.indexOf(':poke_phaHaxelMiningEnd')).substring(21));
    if(data.source.isSneaking){
      PFEHaxelConfigMenu(data)
      return
    }
    let localBlacklist:string[] = []
    localBlacklist = dynamicProperty.blacklist
    let BannedBlocks:string[]=[MinecraftBlockTypes.Air,MinecraftBlockTypes.LightBlock0,MinecraftBlockTypes.LightBlock1,MinecraftBlockTypes.LightBlock2,MinecraftBlockTypes.LightBlock3,MinecraftBlockTypes.LightBlock4,MinecraftBlockTypes.LightBlock5,MinecraftBlockTypes.LightBlock6,MinecraftBlockTypes.LightBlock7,MinecraftBlockTypes.LightBlock8,MinecraftBlockTypes.LightBlock9,MinecraftBlockTypes.LightBlock10,MinecraftBlockTypes.LightBlock11,MinecraftBlockTypes.LightBlock12,MinecraftBlockTypes.LightBlock13,MinecraftBlockTypes.LightBlock14,MinecraftBlockTypes.LightBlock15,MinecraftBlockTypes.Barrier,MinecraftBlockTypes.Jigsaw,MinecraftBlockTypes.StructureBlock,MinecraftBlockTypes.CommandBlock,MinecraftBlockTypes.ChainCommandBlock,MinecraftBlockTypes.RepeatingCommandBlock,MinecraftBlockTypes.BorderBlock,MinecraftBlockTypes.Allow,MinecraftBlockTypes.Deny]
    let location:Vector3 = {x: Math.round(data.source.location.x-(ComponentInfo.radius.x/2)),y:Math.round(data.source.location.y-0.01),z:Math.round(data.source.location.z-(ComponentInfo.radius.z/2))}
    system.runJob(PFEMine(BannedBlocks.concat(localBlacklist),ComponentInfo,location,data.source,data.source.dimension,data.itemStack!.getComponent(ItemComponentTypes.Enchantable)!.hasEnchantment(MinecraftEnchantmentTypes.SilkTouch),data.itemStack))
  }
}

function* PFEMine(BannedBlocks:string[],data:PFEHaxelComponentInfo,location:Vector3,player:Player,dim:Dimension,silkTouch:boolean,item:ItemStack){
  let DurabilityAmount = 0
  for (let x = location.x; x < location.x + data.radius.x; x++) {
    for (let y = location.y; y < location.y + data.radius.y; y++) {
      for (let z = location.z; z < location.z + data.radius.z; z++) {
        const block = dim.getBlock({ x: x, y: y, z: z });
        if (block) {
          if(BannedBlocks.includes(block.typeId) || (block.typeId == MinecraftBlockTypes.Bedrock && !data.canBreakBedrock) || (block.isLiquid && !data.canBreakLiquids)){}
          else{
            DurabilityAmount = DurabilityAmount+1
            if (silkTouch){
              let blockItemStack = block.getItemStack(1,false);
              if (!blockItemStack) blockItemStack = new ItemStack(block.typeId);
              block.dimension.spawnItem(blockItemStack,player.location);
              block.setType(MinecraftBlockTypes.Air)
            }else{
              let blockLocation = `${block.location.x} ${block.location.y} ${block.location.z}`;
              block.dimension.runCommand(`setblock ${blockLocation} air destroy`)
            }
          }
        }
        yield;
      }
    }
  }
  if (DurabilityAmount != 0 && silkTouch){
    player.dimension.playSound("dig.stone", player.location);
  }
  PokeDamageItemUB(item, DurabilityAmount,player,EquipmentSlot.Mainhand);
  if (!silkTouch){
    player.runCommand(`tp @e[type=item,r=${Math.max(data.radius.x,data.radius.y)+1}] @s`)
  }
}

function PFEHaxelConfigMenu(data:ItemComponentUseEvent){
  //@ts-ignore
  let dynamicProperty:PFEHaxelConfig= data.itemStack?.getDynamicProperty(HaxelInfoProperty)
  //@ts-ignore
  dynamicProperty=JSON.parse(dynamicProperty)
  let Ui = new ActionFormData()
  .title({translate:`translation.poke_pha:haxelConfig.mainMenu.title`,with:{rawtext:[{translate:`item.${data.itemStack?.typeId}`.replace(`§9PFE§r`,``)}]}})
  .button({translate:`translation.poke_pha:haxelConfig.mainMenu.blacklistAdd`},`textures/poke/common/blacklist_add`)
  if (dynamicProperty.blacklist.length >= 1){
    Ui.button({translate:`translation.poke_pha:haxelConfig.mainMenu.blacklistRemove`},`textures/poke/common/blacklist_remove`)
  }
  //@ts-ignore
  Ui.show(data.source).then((response =>{
    if (response.canceled)return;
    //Add Block to Blacklist
    if (response.selection == 0){
      PFEHaxelConfigBlackListAdd(data,dynamicProperty)
      return
    }
    //Remove Block from Blacklist
    if (response.selection == 1){
      PFEHaxelConfigBlackListRemove(data,dynamicProperty)
      return
    }
  }))
}
function PFEHaxelConfigBlackListAdd(data:ItemComponentUseEvent,dynamicProperty:PFEHaxelConfig){
  let Ui = new ModalFormData()
  .title({translate:`translation.poke_pha:haxelConfig.mainMenu.title`,with:{rawtext:[{translate:`item.${data.itemStack?.typeId}`.replace(`§9PFE§r`,``)}]}})
  .textField({translate:`translation.poke_pha:haxelConfig.blacklistAdd.textLabel`},'','')
  .submitButton({translate:`translation.poke_pha:haxelConfig.blacklistAdd.submit`})
  Ui.show(data.source).then((response =>{
    if (response.canceled)return;
    let block = response.formValues?.at(0)
    if (block == '')return;
    if (typeof block == "string"){
      if (!block.includes(':')){
        block = `minecraft:${block}`
      }
      block = block.toLowerCase()
      let newProperty:PFEHaxelConfig={
        "blacklist": dynamicProperty.blacklist.concat([block]),
        "v": dynamicProperty.v
      }
      if (data.itemStack == undefined)return;
      PokeSaveProperty(HaxelInfoProperty,data.itemStack,JSON.stringify(newProperty),data.source,EquipmentSlot.Mainhand)
    }
  }))
}
function PFEHaxelConfigBlackListRemove(data:ItemComponentUseEvent,dynamicProperty:PFEHaxelConfig){
  let Ui = new ActionFormData()
  .title({translate:`translation.poke_pha:haxelConfig.mainMenu.blacklistRemove`})
  dynamicProperty.blacklist.forEach(block => {
    Ui.button({translate:`tile.${block.replace(`minecraft:`,``)}.name`})
  });
  Ui.show(data.source).then((response =>{
    if (response.canceled)return;
    for(let i = dynamicProperty.blacklist.length; i >= -1; i--){
      if (response.selection == i){
        dynamicProperty.blacklist.splice(i,1);
        if(data.itemStack==undefined)return;
        PokeSaveProperty(HaxelInfoProperty,data.itemStack,JSON.stringify(dynamicProperty),data.source,EquipmentSlot.Mainhand)
      }
    }
  }))
}
export {
  PFEHaxelComponentInfo,
  PFEHaxelMining
}