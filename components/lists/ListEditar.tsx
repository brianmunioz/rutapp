import IcontactosSQL from '@/interfaces/IContactosSQL';
import React, { useState } from 'react'
import { View, ScrollView } from "react-native";
import { Avatar, Button, Card, Dialog, Icon, IconButton, List,Portal,Text } from 'react-native-paper';

interface IProps{
    datos:IcontactosSQL[]
}

const ListEditar: React.FC<IProps> = ({datos}) => {
    const [eliminarModal,setEliminarModal] = useState({bool:false,id:"",nombre:""});
    const rightActions = (e:IcontactosSQL)=>{
        return <View style={{flexDirection: "row", alignItems: "center", columnGap: 3,paddingRight:0,marginRight:0}}>
                        <Button    onPress={()=>setEliminarModal({bool:!eliminarModal.bool, id:e.id.toString(),nombre:e.nombre})}>

            <Icon color="green"source="eye" size={20}/>
            </Button>
            <Button  mode={"outlined"}  onPress={()=>setEliminarModal({bool:!eliminarModal.bool, id:e.id.toString(),nombre:e.nombre})}>

            <Icon color="grey"source="pencil" size={20}/>
            </Button>
            <Button mode='outlined'   onPress={()=>setEliminarModal({bool:!eliminarModal.bool, id:e.id.toString(),nombre:e.nombre})}>
                <Icon source="delete" color='red' size={20}></Icon> 
            </Button>
            </View>
    }
  return (
    <ScrollView style={{width: "100%",  flex: 1, paddingHorizontal: 10, paddingTop:10,backgroundColor: "white"}}>

         <View style={{flexDirection: "column", gap:10, justifyContent: "center", alignItems:"center", width: "100%"}} >
    {
        datos.map((e)=>  <Card style={{width: "100%"}}>  
            <Card.Title
        title={e.nombre}
        subtitle={e.direccion}
        left={(props) => <Avatar.Icon {...props} icon="folder" />}
        right={(props) => <IconButton {...props} iconColor='red' icon="delete" onPress={() => setEliminarModal({bool:!eliminarModal.bool, id:e.id.toString(),nombre:e.nombre})} />}
      /> 
       <Card.Actions>
       <Button mode='outlined'  onPress={()=>setEliminarModal({bool:!eliminarModal.bool, id:e.id.toString(),nombre:e.nombre})}>

<Icon color="green"source="eye" size={20}/>
</Button>
<Button mode='outlined'   >

<Icon color="grey"source="pencil" size={20}/>
</Button>

    </Card.Actions>
      </Card>
    )
    }
  </View>
  <Portal>
          <Dialog  visible={eliminarModal.bool} onDismiss={()=>setEliminarModal({...eliminarModal,bool:!eliminarModal.bool})}>
            <Dialog.Title>Eliminar contacto</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodyMedium">Está seguro que desea eliminar {eliminarModal.nombre}? </Text>
            </Dialog.Content>
            <Dialog.Actions>
            <Button textColor='black' onPress={()=>setEliminarModal({...eliminarModal,bool:!eliminarModal.bool})}>cancelar</Button>

              <Button textColor='red' onPress={()=>setEliminarModal({...eliminarModal,bool:!eliminarModal.bool})}>Eliminar</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
    </ScrollView>

  )
}

export default ListEditar