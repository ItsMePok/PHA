import { world, EquipmentSlot} from "@minecraft/server";
import { MinecraftEntityTypes } from "@minecraft/vanilla-data";
import { PFEHaxelMining } from "./haxelMining";
import { PokeDamageItemUB} from "./commonFunctions";

world.beforeEvents.worldInitialize.subscribe(data => {
  /*@ts-ignore .sendMessage exists on Player but not entity*/
  data.itemComponentRegistry.registerCustomComponent(`poke_pha:identifier`, {onUseOn(data){if (data.source.typeId == MinecraftEntityTypes.Player){data.source.sendMessage({translate:`translation.poke_pha:identifierMessage`,with:[data.block.typeId]})}}});
  data.itemComponentRegistry.registerCustomComponent("poke_pha:normalMining", {onMineBlock(data){PokeDamageItemUB(data.itemStack!,undefined,data.source,EquipmentSlot.Mainhand);return}});
  data.itemComponentRegistry.registerCustomComponent("poke_pha:haxelMining", new PFEHaxelMining())
})