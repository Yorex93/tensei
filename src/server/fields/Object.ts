import Field from './Field'

export class ObjectField extends Field {
    /**
     *
     * This is a short name for the frontend component that
     * will be mounted for this field.
     */
    public component = 'ObjectField'

    /**
     *
     * This defines a list of all fields in this object.
     * It is also an array of fields.
     *
     */
    public objectFields: Array<Field> = []

    /**
     * When a new date string is initialized, it defaults the
     * date to today's date.
     */
    constructor(name: string, databaseField?: string) {
        super(name, databaseField)
    }

    /**
     *
     * Define a list of all fields in this object.
     * It is also an array of fields.
     *
     */
    public fields(fields: Array<Field>) {
        this.objectFields = fields

        return this
    }

    /**
     *
     * Serialize the object field.
     */
    public serialize() {
        return {
            ...super.serialize(),
            fields: this.objectFields.map((field) => field.serialize()),
        }
    }
}

export default ObjectField
