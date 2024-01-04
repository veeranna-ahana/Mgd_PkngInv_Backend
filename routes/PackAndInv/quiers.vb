Public Class Packing_ScheduleList
    Dim schTable As New DataTable
    Dim clm As DataColumn
    Public Sub New(ByVal CustCode As String, ByVal Type As String)

        ' This call is required by the Windows Form Designer.
        InitializeComponent()

        ' Add any initialization after the InitializeComponent() call.

        clm = New DataColumn("ScheduleId", System.Type.GetType("System.Int32"))
        schTable.Columns.Add(clm)
        clm = New DataColumn("OrdSchNo", System.Type.GetType("System.String"))
        schTable.Columns.Add(clm)
        Me.Label_Cust.Text = PkngInv.getCustData(CustCode).Cust_name
        With PkngInv.getCommand

            .CommandText = "SELECT o.* FROM magodmis.orderschedule o
                        WHERE Not(o.`Schedule_Status`like 'Created' or o.`Schedule_Status`like 'Dispatched' or o.`Schedule_Status`like 'Closed' OR o.`Schedule_Status`like 'Cancelled' OR o.`Schedule_Status`like 'Ready' OR o.`Schedule_Status`like 'Suspended'  )  AND o.`ScheduleType`not like 'Combined'  AND o.`Type`=@Type  AND o.Cust_code=@Cust_code ORDER BY o.`ScheduleDate` desc; "
            .Parameters.Clear()
            .Parameters.AddWithValue("@Type", Type)
            .Parameters.AddWithValue("@Cust_code", CustCode)
            .Connection.Open()

            schTable.Load(.ExecuteReader)

            .Connection.Close()

        End With
        BS_Sch.DataSource = schTable
    End Sub

    Private Sub btn_Open_Click(ByVal sender As System.Object, ByVal e As System.EventArgs) Handles btn_Open.Click
        Using X As New PkngInsp_Schedule(Me.DataGridView1.CurrentRow.Cells("ScheduleId").Value)
            X.ShowDialog()
        End Using
    End Sub

    Private Sub TextBox_FindSch_TextChanged(sender As Object, e As EventArgs) Handles TextBox_FindSch.TextChanged
        Dim filt = String.Format("OrdSchNo Like '{0}%'", TextBox_FindSch.Text)
        BS_Sch.Filter = filt
    End Sub
End Class