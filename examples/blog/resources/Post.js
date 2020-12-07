const {
    dateTime,
    integer,
    text,
    date,
    boolean,
    select,
    resource,
    action,
    textarea,
    hasMany,
    belongsTo,
    belongsToMany,
} = require('@tensei/core')

module.exports = resource('Post')
    .displayInNavigation()
    .actions([
        action('Publish on')
            .positive()
            .handle(async ({ notification }) =>
                notification({
                    message: 'All articles have been published.',
                    variant: 'positive',
                    position: 'top',
                })
            )
            .fields([
                dateTime('Publish date').rules('required'),
                textarea('Reason for publishing')
                    .default('A short description of why you published.')
                    .rules('required', 'max:50'),
                // trix('Post content').rules('required', 'min:12'),
            ])
            .showOnTableRow(),
        action('Archive')
            .handle(async ({ request, models, payoad, html }) =>
                html(
                    `
                <div className='w-full bg-gray-100'>
                    <p>SOME EXAMPLE HTML TO BE SET ON THE DOM</p>
                </div>
            `,
                    201
                )
            )
            .hideOnIndex()
            .confirmButtonText('Archive posts'),
    ])
    .fields([
        text('Title')
            .sortable()
            .searchable()
            .unique()
            .description(
                'This will help you define how this post should work exactly.'
            )
            .rules('required', 'max:24'),
        boolean('Approved')
            .trueLabel('Done')
            .falseLabel('Pending')
            .default(false)
            .hideOnIndex(),
        text('Slug').rules('required', 'slug').unique(),
        text('Description').rules('required').hideOnIndex(),
        // trix('Content').rules('required', 'max:2000', 'min:12').hideOnIndex(),
        integer('Av. CPC').rules('required').hideOnDetail(),
        select('Category')
            .options([
                {
                    label: 'Javascript',
                    value: 'javascript',
                },
                {
                    label: 'Angular',
                    value: 'angular',
                },
                {
                    label: 'Mysql',
                    value: 'mysql',
                },
                {
                    label: 'Postgresql',
                    value: 'pg',
                },
                {
                    label: 'Sequelize',
                    value: 'sequelize',
                },
                {
                    label: 'Mangojs',
                    value: 'mangojs',
                },
            ])
            .rules('required')
            .searchable()
            .description('Select one of these technologies to write about.'),
        belongsTo('User').searchable().rules('required'),
        date('Published At')
            .notNullable()
            .firstDayOfWeek(4)
            .rules('required', 'date')
            .format('do MMM yyyy, hh:mm a'),
        dateTime('Scheduled For')
            .nullable()
            .rules('required', 'date')
            .format('do MMM yyyy, hh:mm a')
            .hideOnIndex(),
        belongsToMany('Tag').owner(),
        hasMany('Comment'),
    ])
    .perPageOptions([25, 50, 100])
    .displayField('title')
    .permissions(['create:matrix', 'update:matrix'])
