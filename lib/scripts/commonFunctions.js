import { EntityComponentTypes, EquipmentSlot, GameMode, ItemComponentTypes } from "@minecraft/server";
import { MinecraftEnchantmentTypes, MinecraftEntityTypes } from "@minecraft/vanilla-data";
export { PokeDamageItemUB, PokeSaveProperty, };
function PokeDamageItemUB(item, multiplier, entity, slot) {
    var _a;
    if (!item.hasComponent(ItemComponentTypes.Durability)) {
        PokeSaveProperty(`poke:holdFix`, item, Math.round(Math.random() * 100), entity, slot);
        return { tookDurability: false, failed: true, broke: false };
    }
    if (!entity.hasComponent(EntityComponentTypes.Equippable)) {
        return { tookDurability: false, failed: true, broke: false };
    }
    //@ts-ignore
    let equippableComponent = entity.getComponent(EntityComponentTypes.Equippable);
    //@ts-ignore
    const durabilityComponent = item.getComponent(ItemComponentTypes.Durability);
    var unbreakingL = 0;
    if (!slot) {
        slot = EquipmentSlot.Mainhand;
    }
    if (entity.typeId == MinecraftEntityTypes.Player) {
        //@ts-ignore 
        if (entity.getGameMode() == GameMode.creative) {
            PokeSaveProperty(`poke:holdFix`, item, Math.round(Math.random() * 100), entity, slot);
            return { tookDurability: false, failed: false, broke: false, gmc: true };
        }
    }
    if (item.hasComponent(ItemComponentTypes.Enchantable)) {
        if (item.getComponent(ItemComponentTypes.Enchantable).hasEnchantment(MinecraftEnchantmentTypes.Unbreaking)) {
            //@ts-ignore
            unbreakingL = item.getComponent(ItemComponentTypes.Enchantable).getEnchantment(MinecraftEnchantmentTypes.Unbreaking).level;
        }
    }
    let damage = Number(Math.round(Math.random() * 100) <= durabilityComponent.getDamageChance(unbreakingL));
    if (typeof multiplier == "number") {
        damage *= multiplier;
    }
    if (durabilityComponent.damage + damage >= durabilityComponent.maxDurability)
        durabilityComponent.damage = durabilityComponent.maxDurability;
    else
        durabilityComponent.damage += damage;
    if (durabilityComponent.damage >= durabilityComponent.maxDurability) {
        if (((_a = equippableComponent.getEquipment(slot)) === null || _a === void 0 ? void 0 : _a.typeId) == item.typeId) {
            equippableComponent.setEquipment(slot, undefined);
            entity.dimension.playSound(`random.break`, entity.location, { pitch: Math.max(Math.max((Math.random() * 1.05), 0.95)) });
        }
        return;
    }
    PokeSaveProperty(`poke:holdFix`, item, Math.round(Math.random() * 100), entity, slot);
    return;
}
function PokeSaveProperty(propertyId, item, save, entity, slot) {
    item.setDynamicProperty(propertyId, save);
    if (!slot)
        slot = EquipmentSlot.Mainhand;
    let equippableComponent = entity.getComponent(EntityComponentTypes.Equippable);
    if (equippableComponent.getEquipmentSlot(slot).typeId == item.typeId) {
        equippableComponent.setEquipment(slot, item);
        return true;
    }
    else {
        return false;
    }
}
//# sourceMappingURL=commonFunctions.js.map