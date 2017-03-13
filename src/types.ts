
export type IIndexType<T> = {
    [index: string]: T
};

export type PageTitleType = {
    title: string,
    simple?: string,
    special?: string,
    description?: string,
    isDisambiguation?: boolean
};

export type LanguageValueType<T> = {
    language: string;
    value: T;
}
export type WikidataEntityTypeType = 'item' | 'property';

export interface WikidataBaseEntity {
    pageid?: number;
    lastrevid?: number;
    modified?: string;
    type: WikidataEntityTypeType;
    id: string;
}

export interface WikidataEntityType extends WikidataBaseEntity {
    labels?: IIndexType<LanguageValueType<string>>;
    descriptions?: IIndexType<LanguageValueType<string>>;
    aliases?: IIndexType<LanguageValueType<string>[]>;
    claims?: IIndexType<any[]>;
    sitelinks?: IIndexType<{ site: string, title: string }>;
}

export type WikidataEntityQualifierType = {
    value: string | number | any;
}

export type WikidataEntityClaimType = {
    value: string | number | any;
    qualifiers?: IIndexType<WikidataEntityQualifierType[]>;
};

export type WikidataEntityClaimsType = IIndexType<WikidataEntityClaimType[]>;

export interface WikidataSimpleEntityType extends WikidataBaseEntity {
    labels?: IIndexType<string>;
    descriptions?: IIndexType<string>;
    aliases?: IIndexType<string[]>;
    claims?: WikidataEntityClaimsType;
    sitelinks?: IIndexType<string>;
}

export type EntityTypeType = 'place' | 'person' | 'org';

export type EntityType = {
    id: string;

    pageid?: number;
    lastrevid?: number;
    modified?: string;

    labels?: IIndexType<string>;
    descriptions?: IIndexType<string>;
    aliases?: IIndexType<string[]>;
    claims?: WikidataEntityClaimsType;
    sitelinks?: IIndexType<string>;

    type?: EntityTypeType;

};