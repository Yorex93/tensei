import Qs from 'qs'
import Paginate from 'react-paginate'
import { throttle } from 'throttle-debounce'
import Paginator from '../../components/Paginator'
import React, { useState, useCallback, useEffect } from 'react'
import { Link, useHistory, useLocation } from 'react-router-dom'
import {
    Table,
    SearchInput,
    Select,
    Button,
    Heading,
    ResourceContract,
    PaginatedData,
    AbstractData,
    DeleteModal
} from '@tensei/components'

export interface ResourceProps {
    detailId?: string
    baseResource: ResourceContract
    relatedResource?: ResourceContract
}

const Resource: React.FC<ResourceProps> = ({
    baseResource,
    relatedResource,
    detailId
}) => {
    const resource = relatedResource ? relatedResource : baseResource
    const history = useHistory()
    const location = useLocation()
    const [search, setSearch] = useState('')
    const [deleting, setDeleting] = useState<AbstractData | null>(null)

    const fields = resource.fields.filter(field => field.showOnIndex)

    const relatedField = baseResource.fields.find(
        f =>
            f.name === relatedResource?.name &&
            ['OneToMany', 'ManyToMany'].includes(f.fieldName)
    )

    if (!relatedField && relatedResource) {
        return null
    }

    const searchableFields = resource.fields.filter(field => field.isSearchable)

    const getDefaultParametersFromSearch = () => {
        const searchQuery = Qs.parse(location.search.split('?')[1])

        const sort = (
            (searchQuery[`${resource.slug}_sort`] as string) || ''
        ).split('___')

        return {
            page: searchQuery[`${resource.slug}_page`] || 1,
            per_page:
                searchQuery[`${resource.slug}_per_page`] ||
                resource.perPageOptions[0] ||
                10,
            sort: sort
                ? {
                      field: sort[0],
                      direction: sort[1]
                  }
                : {}
        }
    }

    const defaultParams = getDefaultParametersFromSearch()

    const getDefaultData = () => ({
        meta: {
            page: parseInt(defaultParams.page as string),
            per_page: parseInt(defaultParams.per_page as string)
        },
        data: [],
        sort: defaultParams.sort as any
    })

    const [data, setData] = useState<PaginatedData>(getDefaultData())

    const [loading, setLoading] = useState(true)

    const getSearchString = () => {
        const parameters: any = {
            [`${resource.slug}_page`]: data.meta.page,
            [`${resource.slug}_per_page`]: data.meta.per_page
        }

        if (data.sort?.field) {
            parameters[
                `${resource.slug}_sort`
            ] = `${data.sort?.field}___${data.sort?.direction}`
        }

        if (search) {
            parameters[`${resource.slug}_search`] = search
        }

        return Qs.stringify(parameters, { encodeValuesOnly: true })
    }

    const getQuery = () => {
        let parameters: any = {
            where: {}
        }

        if (search) {
            parameters.where._or = searchableFields.map(field => ({
                [field.inputName]: {
                    _like: `%${search}%`
                }
            }))
        }

        if (data.sort?.field) {
            parameters.sort = `${data.sort.field}:${data.sort.direction}`
        }

        parameters.page = data.meta.page
        parameters.per_page = data.meta.per_page

        return Qs.stringify(parameters, { encodeValuesOnly: true })
    }

    const fetchData = useCallback(
        throttle(
            700,
            (currentData: PaginatedData, slug: string, query: string) => {
                setLoading(true)

                window.Tensei.client
                    .get(
                        relatedResource
                            ? `${baseResource.slug}/${detailId}/${relatedField?.inputName}?${query}`
                            : `${slug}?${query}`
                    )
                    .then(({ data: payload }) => {
                        setData({
                            ...currentData,
                            data: payload.data,
                            meta: payload.meta
                        })
                        setLoading(false)
                    })
            }
        ),
        []
    )

    useEffect(() => {
        setData(getDefaultData())
    }, [resource.slug])

    useEffect(() => {
        fetchData(data, resource.slug, getQuery())

        history.push({
            pathname: location.pathname,
            search: getSearchString()
        })
    }, [data.meta.per_page, data.meta.page, data.sort, search])

    const computePaginationValues = () => {
        const to = data.meta.per_page * data.meta.page

        return {
            from: data.meta.per_page * (data.meta.page - 1) + 1,
            to: data.meta.total && data.meta.total <= to ? data.meta.total : to,
            total: data.meta.total
        }
    }

    const paginationValues = computePaginationValues()

    const columns = [
        ...fields.map(field => ({
            title: field.name,
            field: field.inputName,
            sorter: field.isSortable,
            render: (value: string, row: any) => {
                const Component =
                    window.Tensei.components.index[field.component.index] ||
                    window.Tensei.components.index.Text

                return (
                    <Component
                        field={field}
                        values={row}
                        value={row[field.inputName]}
                        resource={resource}
                    />
                )
            }
        })),
        (window.Tensei.state.permissions[`show:${resource.slug}`] ||
            window.Tensei.state.permissions[`update:${resource.slug}`] ||
            window.Tensei.state.permissions[`delete:${resource.slug}`]) && {
            title: <span className="sr-only">Actions</span>,
            field: 'actions',

            render: (value: string, row: any) => (
                <div className="flex items-center">
                    {window.Tensei.state.permissions[
                        `show:${resource.slug}`
                    ] && (
                        <Link
                            to={window.Tensei.getPath(
                                `resources/${resource.slug}/${row.id}`
                            )}
                            className="flex mr-4 items-center justify-center bg-tensei-gray-600 h-10 w-10 rounded-full opacity-80 hover:opacity-100 transition duration-100 ease-in-out"
                        >
                            <span className="sr-only">View resource</span>

                            <svg
                                width={20}
                                height={20}
                                className="fill-current text-tensei-gray-800"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path
                                    fillRule="evenodd"
                                    d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </Link>
                    )}
                    {window.Tensei.state.permissions[
                        `update:${resource.slug}`
                    ] && (
                        <Link
                            to={window.Tensei.getPath(
                                `resources/${resource.slug}/${row.id}/update`
                            )}
                            className="flex mr-4 items-center justify-center bg-tensei-gray-600 h-10 w-10 rounded-full opacity-80 hover:opacity-100 transition duration-100 ease-in-out"
                        >
                            <span className="sr-only">Edit</span>
                            <svg
                                className="fill-current text-tensei-gray-800"
                                width={16}
                                height={16}
                                viewBox="0 0 14 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M0.25 10.9374V13.7499H3.0625L11.3575 5.45492L8.545 2.64242L0.25 10.9374ZM13.5325 3.27992C13.825 2.98742 13.825 2.51492 13.5325 2.22242L11.7775 0.467422C11.485 0.174922 11.0125 0.174922 10.72 0.467422L9.3475 1.83992L12.16 4.65242L13.5325 3.27992Z" />
                            </svg>
                        </Link>
                    )}
                    {window.Tensei.state.permissions[
                        `delete:${resource.slug}`
                    ] && (
                        <button
                            onClick={() => setDeleting(row)}
                            className="flex items-center justify-center bg-tensei-gray-600 h-10 w-10 rounded-full opacity-80 hover:opacity-100 transition duration-100 ease-in-out"
                        >
                            <span className="sr-only">Delete</span>
                            <svg
                                width={16}
                                height={16}
                                className="fill-current text-tensei-gray-800"
                                viewBox="0 0 12 14"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path d="M1.5 12.25C1.5 13.075 2.175 13.75 3 13.75H9C9.825 13.75 10.5 13.075 10.5 12.25V3.25H1.5V12.25ZM11.25 1H8.625L7.875 0.25H4.125L3.375 1H0.75V2.5H11.25V1Z" />
                            </svg>
                        </button>
                    )}
                </div>
            )
        }
    ].filter(Boolean)

    return (
        <>
            <DeleteModal
                open={!!deleting}
                resource={resource}
                setOpen={() => setDeleting(null)}
                selected={[deleting!].filter(Boolean)}
                onDelete={() => fetchData(data, resource.slug, getQuery())}
            />
            <Heading as="h2" className="mb-5 text-2xl">
                {resource.label}
            </Heading>
            <div className="flex flex-wrap justify-between items-center w-full">
                <div className="flex flex-wrap w-full md:w-auto">
                    <SearchInput
                        className="md:mr-5 w-full mb-3 md:mb-0 md:w-96"
                        value={search || ''}
                        onChange={event => setSearch(event.target.value)}
                    />
                </div>

                {window.Tensei.state.permissions[`insert:${resource.slug}`] ? (
                    <Link
                        to={window.Tensei.getPath(
                            `resources/${resource.slug}/create`
                        )}
                    >
                        <Button className="mt-3 md:mt-0" primary>
                            Add {resource.name}
                        </Button>
                    </Link>
                ) : null}
            </div>

            <div className="mt-8">
                <div className="flex flex-col">
                    <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                            <div className="overflow-hidden border border-tensei-gray-600 rounded-lg">
                                <Table
                                    sort={data.sort}
                                    loading={loading}
                                    columns={columns as any[]}
                                    onSort={sort => setData({ ...data, sort })}
                                    rows={data.data as any}
                                    selection={{
                                        onChange: () => {}
                                    }}
                                    Empty={() => (
                                        <tr className="h-24">
                                            <td colSpan={columns.length + 1}>
                                                <div className="w-full h-full flex flex-col items-center justify-center my-8">
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width={65}
                                                        height={51}
                                                        viewBox="0 0 65 51"
                                                        className="mb-4 text-tensei-gray-500 fill-current"
                                                    >
                                                        <path d="M56 40h2c.552285 0 1 .447715 1 1s-.447715 1-1 1h-2v2c0 .552285-.447715 1-1 1s-1-.447715-1-1v-2h-2c-.552285 0-1-.447715-1-1s.447715-1 1-1h2v-2c0-.552285.447715-1 1-1s1 .447715 1 1v2zm-5.364125-8H38v8h7.049375c.350333-3.528515 2.534789-6.517471 5.5865-8zm-5.5865 10H6c-3.313708 0-6-2.686292-6-6V6c0-3.313708 2.686292-6 6-6h44c3.313708 0 6 2.686292 6 6v25.049375C61.053323 31.5511 65 35.814652 65 41c0 5.522847-4.477153 10-10 10-5.185348 0-9.4489-3.946677-9.950625-9zM20 30h16v-8H20v8zm0 2v8h16v-8H20zm34-2v-8H38v8h16zM2 30h16v-8H2v8zm0 2v4c0 2.209139 1.790861 4 4 4h12v-8H2zm18-12h16v-8H20v8zm34 0v-8H38v8h16zM2 20h16v-8H2v8zm52-10V6c0-2.209139-1.790861-4-4-4H6C3.790861 2 2 3.790861 2 6v4h52zm1 39c4.418278 0 8-3.581722 8-8s-3.581722-8-8-8-8 3.581722-8 8 3.581722 8 8 8z" />
                                                    </svg>
                                                    <p>
                                                        No{' '}
                                                        {resource.name.toLowerCase()}{' '}
                                                        matched the given
                                                        criteria.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-between">
                    <Select
                        className="w-full md:w-auto mb-3 md:mb-0"
                        roundedFull
                        hideFirstOption
                        options={
                            resource.perPageOptions?.map(option => ({
                                value: option,
                                label: `${option} / page`
                            })) || []
                        }
                        value={data.meta.per_page}
                        onChange={event =>
                            setData({
                                ...data,
                                meta: {
                                    ...data.meta,
                                    per_page: parseInt(event.target.value, 10)
                                }
                            })
                        }
                    />

                    {data?.meta?.total && data.meta.total > 0 ? (
                        <div className="hidden md:block">
                            <p className="">
                                Showing
                                <span className="font-medium mx-1">
                                    {paginationValues.from}
                                </span>
                                to
                                <span className="font-medium mx-1">
                                    {paginationValues.to}
                                </span>
                                of
                                <span className="font-medium mx-1">
                                    {paginationValues.total}
                                </span>
                                results
                            </p>
                        </div>
                    ) : null}

                    {loading &&
                    data.meta &&
                    data.meta.page &&
                    data.meta.total === 0 ? null : (
                        <Paginator
                            page={data.meta.page - 1}
                            page_count={data.meta.page_count!}
                            onPageChange={({ selected }) => {
                                setData({
                                    ...data,
                                    meta: {
                                        ...data.meta,
                                        page: selected + 1
                                    }
                                })
                            }}
                        />
                    )}
                </div>
            </div>
        </>
    )
}

export default Resource
