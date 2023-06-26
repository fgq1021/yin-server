export const systemDefaultModel = [
    {
        "_id": "64255194330fca6bae002f7d",
        "_title": "系统模型库",
        "_schema": [
            {
                "title": "模型库",
                "name": "modelLib",
                "keyType": "Array",
                "note": ""
            }
        ]
    },
    {
        "_id": "642551bf330fca6bae002f8b",
        "_title": "根用户",
        "accessControl": [],
        "_parents": [
            "64255194330fca6bae002f7d.modelLib"
        ],
        "_schema": [
            {
                "title": "元素",
                "name": "elements",
                "keyType": "Element",
                "note": "",
                "settings": {}
            },
            {
                "title": "用户",
                "name": "users",
                "keyType": "User",
                "note": "",
                "settings": {
                    "module": "User"
                }
            },
            {
                "title": "模型",
                "name": "models",
                "keyType": "Model",
                "note": "",
                "settings": {
                    "module": "Model"
                }
            },
            {
                "title": "系统配置",
                "name": "systemConfig",
                "keyType": "System",
                "note": "",
                "settings": {
                    "module": "System"
                }
            },
            {
                "title": "头像",
                "name": "img",
                "keyType": "Image",
                "note": ""
            }
        ],
        "hide": false,
        "createdAt": "2023-03-30T09:09:19.373Z",
        "updatedAt": "2023-04-01T07:31:35.083Z",
        "__v": 5,
        "_map": {
            "elements": "Model.6425931b8621b1edbd665854",
            "users": "Model.6425544f02ebc504ec896a81",
            "models": "Model.64255194330fca6bae002f7d",
            "system": "Model.6425545002ebc504ec896a8b",
            "systemConfig": "Model.642593428621b1edbd665860"
        },
        "_data": {},
        "model": null
    },
    {
        "_id": "64255d2e375d586f431da9d3",
        "_title": "网络",
        "accessControl": [],
        "_parents": [],
        "_schema": [
            {
                "title": "端口",
                "name": "port",
                "keyType": "Number",
                "note": ""
            },
            {
                "title": "网络访问加密",
                "name": "ssl",
                "keyType": "Boolean",
                "note": ""
            },
            {
                "title": "加密证书",
                "name": "cert",
                "keyType": "String",
                "note": ""
            },
            {
                "title": "密钥",
                "name": "key",
                "keyType": "String",
                "note": ""
            }
        ],
        "hide": false,
        "createdAt": "2023-03-30T09:58:06.578Z",
        "updatedAt": "2023-03-30T10:05:37.466Z",
        "__v": 1,
        "_data": {
            "port": 80,
            "cert": ""
        },
        "model": null
    },
    {
        "_id": "64255f1b375d586f431da9e9",
        "_title": "安全",
        "accessControl": [],
        "_parents": [],
        "_schema": [
            {
                "title": "密钥",
                "name": "secret",
                "keyType": "String",
                "note": ""
            }
        ],
        "hide": false,
        "createdAt": "2023-03-30T10:06:19.797Z",
        "updatedAt": "2023-03-30T10:29:15.628Z",
        "__v": 1,
        "model": null
    },
    {
        "_id": "64255f59375d586f431daa03",
        "_title": "文件系统",
        "accessControl": [],
        "_parents": [],
        "_schema": [
            {
                "title": "对象存储",
                "name": "oss",
                "keyType": "Boolean",
                "note": ""
            },
            {
                "title": "对象存储访问域名",
                "name": "endpoint",
                "keyType": "String",
                "note": "OSS属于云服务，最少需要在 系统配置.云服务 中添加一个服务才能使用"
            }
        ],
        "hide": false,
        "createdAt": "2023-03-30T10:07:21.462Z",
        "updatedAt": "2023-03-30T10:52:35.967Z",
        "__v": 2,
        "model": null
    },
    {
        "_id": "642565702dced3761fb695ce",
        "_title": "云服务",
        "accessControl": [],
        "_parents": [],
        "_schema": [
            {
                "title": "阿里云",
                "name": "aliyun",
                "keyType": "Object",
                "note": ""
            },
            {
                "title": "腾讯云",
                "name": "tencentCloud",
                "keyType": "Object",
                "note": ""
            },
            {
                "title": "华为云",
                "name": "huaweiCloud",
                "keyType": "Object",
                "note": ""
            },
            {
                "title": "联通云",
                "name": "cucloud",
                "keyType": "Object",
                "note": ""
            }
        ],
        "hide": false,
        "createdAt": "2023-03-30T10:33:20.492Z",
        "updatedAt": "2023-03-30T10:36:57.690Z",
        "__v": 1,
        "_map": {
            "aliyun": "Model.642566492dced3761fb695d9"
        },
        "model": null
    },
    {
        "_id": "642566492dced3761fb695d9",
        "_title": "阿里云",
        "accessControl": [],
        "_parents": [],
        "_schema": [
            {
                "title": "accessKeyId",
                "name": "accessKeyId",
                "keyType": "String",
                "note": ""
            },
            {
                "title": "accessKeySecret",
                "name": "accessKeySecret",
                "keyType": "String",
                "note": ""
            },
            {
                "title": "对象存储",
                "name": "OSS",
                "keyType": "Object",
                "note": ""
            },
            {
                "title": "短信服务",
                "name": "SMS",
                "keyType": "Object",
                "note": ""
            }
        ],
        "hide": false,
        "createdAt": "2023-03-30T10:36:57.687Z",
        "updatedAt": "2023-04-01T08:26:22.202Z",
        "__v": 2,
        "_map": {
            "OSS": "Model.6427eaaddde1888274b3bd14",
            "SMS": "Model.6427eaaedde1888274b3bd19"
        },
        "model": null
    },
    {
        "_id": "642593428621b1edbd665860",
        "_title": "系统配置",
        "accessControl": [],
        "_parents": [],
        "_schema": [
            {
                "title": "数据库链接",
                "name": "db",
                "keyType": "String",
                "note": ""
            },
            {
                "title": "根用户",
                "name": "root",
                "keyType": "User",
                "note": "",
                "settings": {
                    "module": "User"
                }
            },
            {
                "title": "网络",
                "name": "network",
                "keyType": "Object",
                "note": ""
            },
            {
                "title": "安全",
                "name": "safety",
                "keyType": "Object",
                "note": ""
            },
            {
                "title": "文件系统",
                "name": "fileSystem",
                "keyType": "Object",
                "note": ""
            },
            {
                "title": "云服务",
                "name": "cloud",
                "keyType": "Object",
                "note": ""
            },
            {
                "title": "系统模型库",
                "name": "systemModels",
                "keyType": "Model",
                "note": "",
                "settings": {
                    "module": "Model"
                }
            }
        ],
        "hide": false,
        "createdAt": "2023-03-30T13:48:50.203Z",
        "updatedAt": "2023-03-30T13:53:07.078Z",
        "__v": 1,
        "_map": {
            "root": "Model.642551bf330fca6bae002f8b",
            "network": "Model.64255d2e375d586f431da9d3",
            "safety": "Model.64255f1b375d586f431da9e9",
            "fileSystem": "Model.64255f59375d586f431daa03",
            "cloud": "Model.642565702dced3761fb695ce",
            "systemModels": "Model.64255194330fca6bae002f7d"
        },
        "_data": {},
        "model": null
    },
    {
        "_id": "6427eaaddde1888274b3bd14",
        "_title": "对象存储",
        "accessControl": [],
        "_parents": [],
        "_schema": [],
        "hide": false,
        "createdAt": "2023-04-01T08:26:21.434Z",
        "updatedAt": "2023-04-01T08:26:21.434Z",
        "__v": 0
    },
    {
        "_id": "6427eaaedde1888274b3bd19",
        "_title": "短信服务",
        "accessControl": [],
        "_parents": [],
        "_schema": [],
        "hide": false,
        "createdAt": "2023-04-01T08:26:22.193Z",
        "updatedAt": "2023-04-01T08:26:22.193Z",
        "__v": 0
    }
]
