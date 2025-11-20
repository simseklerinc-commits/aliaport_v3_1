USE [Aliaport_v3_1];

IF OBJECT_ID(N'dbo.Hizmet', N'U') IS NULL
BEGIN
    PRINT 'Creating table dbo.Hizmet';

    CREATE TABLE dbo.Hizmet (
        Id           INT IDENTITY(1,1) PRIMARY KEY,
        Kod          NVARCHAR(50)  NOT NULL UNIQUE,
        Ad           NVARCHAR(200) NOT NULL,
        GrupKod      NVARCHAR(50)  NULL,
        Birim        NVARCHAR(20)  NULL,
        Fiyat        DECIMAL(18,4) NULL,
        ParaBirimi   NVARCHAR(10)  NOT NULL CONSTRAINT DF_Hizmet_ParaBirimi DEFAULT('TRY'),
        KdvOrani     DECIMAL(5,2)  NULL,
        SiraNo       INT           NULL,
        AktifMi      BIT           NOT NULL CONSTRAINT DF_Hizmet_AktifMi DEFAULT(1),
        CreatedAt    DATETIME2     NOT NULL CONSTRAINT DF_Hizmet_CreatedAt DEFAULT(SYSDATETIME()),
        UpdatedAt    DATETIME2     NULL
    );
END
ELSE
BEGIN
    PRINT 'Table dbo.Hizmet already exists';
END
