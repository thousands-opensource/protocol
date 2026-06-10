import {
    ActionRowBuilder,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";

/**
 * Add a text input field to a modal
 * @param mb modal builder to add the field to
 * @param fieldId id of the field
 * @param label label of the field
 */
export function addModalField(
    mb: ModalBuilder,
    fieldId: string,
    label: string,
    required: boolean,
    placeholder?: string,
    value?: string
) {
    const tib = new TextInputBuilder()
        .setCustomId(fieldId)
        .setLabel(label)
        .setRequired(required)
        .setPlaceholder(placeholder)
        .setStyle(TextInputStyle.Short);

    if (value) {
        tib.setValue(value);
    }

    mb.addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            tib
        )
    );
}

/**
 * Add a text input field to a modal
 * @param mb modal builder to add the field to
 * @param fieldId id of the field
 * @param label label of the field
 */
export function addModalFieldParagraph(
    mb: ModalBuilder,
    fieldId: string,
    label: string,
    required: boolean,
    maxLength?: number,
    minLength?: number,
    placeholder?: string
) {
    const tib = new TextInputBuilder()
        .setCustomId(fieldId)
        .setLabel(label)
        .setRequired(required)
        .setPlaceholder(placeholder)
        .setMaxLength(maxLength || 1000)
        .setMinLength(minLength || 5)
        .setStyle(TextInputStyle.Paragraph);

    mb.addComponents(
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
            tib
        )
    );
}
