import * as fs from 'fs';

class Parsim {
    filePath: string
    loadDataInMemory: boolean
    encondig: BufferEncoding = 'utf8'
    data: DataBase = {
        groups: []
    }

    constructor(filePath: string, loadDataInMemory: boolean = false, encoding: BufferEncoding = 'utf-8') {
        this.filePath = filePath;
        this.loadDataInMemory = loadDataInMemory;
        this.encondig = encoding;
        this.initialize();

        if (loadDataInMemory) {
            this.loadInMemory(encoding);
        }
    }


    //create file if don´t exist
    private initialize(){
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath,JSON.stringify(
                {
                    groups: []
                }
            ))
        }
    }

    private loadInMemory(fileEncode: BufferEncoding = 'utf-8'): void {
        this.data = this.loadFileData(fileEncode);
    }

    //Load from file
    private loadFileData(fileEncode: BufferEncoding = 'utf-8'): DataBase {
        return JSON.parse(fs.readFileSync(this.filePath, { encoding: 'utf8', flag: 'r' }));
    }


    private saveData(data: DataBase): void {
        let dataJson:string = JSON.stringify(data);

        fs.writeFileSync(this.filePath,dataJson);
    }


    //Get single data from a group
    getSingleData(groupKey: string, dataPredicate:  (value: DataBox) => unknown): DataBox | undefined {

        //Load data
        let data: DataBase = this.getDataBase();
        //Find group
        let groups: DataGroup | undefined = data.groups.find(x => x.key == groupKey) || 
        { key: "", idCount: 0, data: []};


        //Find data in the group
        for (let index = 0; index < groups.data.length; index++) {
            const dataBox:DataBox = groups.data[index];
            if (dataPredicate(dataBox)) {
                return dataBox;
            }
        }
    }

    //Reload data from file, Warning : only work if loadInMemory is true
    reloadDataFromFile():void{
        if (this.loadDataInMemory) {
            this.loadInMemory(this.encondig);
        }
    }

    private getDataBase(): DataBase {
        let data: DataBase = this.loadDataInMemory ? this.data : this.loadFileData();

        return data;
    }

    //Get group
    getGroup(key: string): DataGroup | undefined {
        let data: DataBase = this.getDataBase();

        return data.groups.find(x => x.key == key);
    }

    getMultipleGroups(groupPredicate: (value: DataGroup, key: number) => unknown): DataGroup[] | undefined {
        let data: DataBase = this.getDataBase();

        return data.groups.filter(groupPredicate) || [];
    }

    //Add new group
    addGroup(key: string, startCount:number = 0): void {
        let data: DataBase = this.getDataBase();

        let newGroup: DataGroup = {
            key: key,
            idCount: startCount,
            data: []
        }


        data.groups.push(newGroup);

        this.saveData(data);
    }


    
    addData(groupKey: string, value: any): void {

        let dataBase: DataBase = this.getDataBase();


        //Find group
        let group: DataGroup | undefined = dataBase.groups.find(x => x.key == groupKey)
            || { key: "", idCount: 0, data: []};

        //increase counting to be used in id
        group.idCount++;

        group.data.push({
            data : value,
            id : group.idCount
        });

        for (let index = 0; index < dataBase.groups.length; index++) {
            if (dataBase.groups[index].key == group.key) {
                dataBase.groups[index] = group;
            }
        }

        this.saveData(dataBase);
    }


  
    replaceGroup(groupKey: string, group: DataGroup): void {
        let dataBase: DataBase = this.getDataBase();

        dataBase.groups = dataBase.groups.filter((value,key) => {
            return value.key != groupKey;
        })

        dataBase.groups.push(group);
        this.saveData(dataBase);
    }



    removeGroup(predicate: (value: DataGroup) => unknown): void {

        let data: DataBase = this.getDataBase();

        data.groups = data.groups.filter((value, index) => {
            return !predicate(value);
        });

        this.saveData(data);
    }

    
    getMultipleData(groupKey:string, dataPredicate: (value: DataBox, key: number) => unknown):DataBox[]|undefined{
        let data: DataBase = this.getDataBase();
        return  data.groups.find(group => group.key == groupKey)?.data.filter(dataPredicate) || [];
    }

    getAllData(groupKey:string):any[]|undefined{
        let data: DataBase = this.getDataBase();
        return  data.groups.find(group => group.key == groupKey)?.data;
    }

    
    removeData(groupKey: string, dataPredicate: (value: DataBox) => unknown): void {

        //Load data
        let data: DataBase = this.getDataBase();
        //Find group
        let group: DataGroup | undefined = data.groups.find(x => x.key == groupKey)
            || { key: "", idCount: 0, data: [] };

        group.data = group.data.filter((value, key) => {
            return !dataPredicate(value);
        })

        this.replaceGroup(group.key, group);
    }

}

interface DataBase {
    groups: DataGroup[]
}

type DataBox = {
    id : number,
    data : any
}
type DataGroup = {
    key: string
    idCount: number,
    data: DataBox[]
}

export default Parsim;