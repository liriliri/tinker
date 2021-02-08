import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
`

export default class Main extends React.Component {
  render() {
    return (<Container>Hello World</Container>)
  }
}