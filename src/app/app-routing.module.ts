import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SidebarComponent } from './sidebar/sidebar.component';
import { UploaderComponent } from './uploader/uploader.component';

const routes: Routes = [
  {
    path: 'upload',
    component: UploaderComponent,
  },
  {
    path: '',
    component: SidebarComponent,
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
