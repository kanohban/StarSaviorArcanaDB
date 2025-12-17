class Item {
    constructor(data) {
        this.id = data[0];
        this.name = data[1];
        this.rarity = data[2];
        this.tag = data[3]; // 0:요리, 1:서적, 2:부적, 3:귀중품
        this.image = data[4]; // image filename
        this.cost = data[5];
        this.obt_place = data[6];
        this.obt_journey_id = data[7];
        this.obt_journey_name = data[8];
        this.req_journey_id = data[9];
        this.req_journey_name = data[10];

        // Parse effects (type_1, value_1, type_2, value_2)
        this.effects = [];
        if (data[11] !== undefined && data[11] !== "") {
            this.effects.push({ type: data[11], value: data[12] });
        }
        if (data[13] !== undefined && data[13] !== "") {
            this.effects.push({ type: data[13], value: data[14] });
        }

        this.flavor_text = data[15];

        // Tag 2 (Charm/Amulet) specific fields
        if (this.tag === 2) {
            this.refund_poten = data[16];
            this.target = data[17];
            this.effect_desc = data[18];
        }
    }
}

module.exports = { Item };
