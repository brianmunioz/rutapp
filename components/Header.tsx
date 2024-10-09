import { Actionsheet, Box, Button, Center, HamburgerIcon, Text, ThreeDotsIcon, useDisclose } from "native-base";
import { Fragment, useState } from "react";
interface MenuContactoRepartoProps {
  modo: boolean;  // 'modo' es numérico
  setModo: () => void;  // 'setModo' es una función que recibe un número
}
const MenuContactoReparto : React.FC<MenuContactoRepartoProps> = ({modo,setModo})=> {
    const {
      isOpen,
      onOpen,
      onClose
    } = useDisclose();
    return <Center>
        <Button backgroundColor={"#051b37"}  onPress={onOpen}><HamburgerIcon style={{width:"50px"}} color="#fff"/></Button>
        <Actionsheet isOpen={isOpen} onClose={onClose}>
          <Actionsheet.Content>
            {modo?
            <Fragment>
            <Actionsheet.Item>Crear nuevo contacto </Actionsheet.Item>
            <Actionsheet.Item isDisabled>Ver listado</Actionsheet.Item>
            </Fragment>
          :
          <Fragment>
            <Actionsheet.Item>Iniciar reparto </Actionsheet.Item>
            <Actionsheet.Item isDisabled>Crear reparto </Actionsheet.Item>
            <Actionsheet.Item isDisabled>Ver listado</Actionsheet.Item>
            </Fragment>
          }
            
            <Actionsheet.Item onPress={()=>setModo()}>{modo ? "Cambiar a modo reparto":"Cambiar a modo contacto"}</Actionsheet.Item>
          </Actionsheet.Content>
        </Actionsheet>
      </Center>;
  }
  export default MenuContactoReparto

  